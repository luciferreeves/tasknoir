import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { isAdmin } from "~/server/api/utils/admin";

export const taskRouter = createTRPCRouter({
  // Get all tasks for the current user
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        status: z
          .enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"])
          .optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        assignedToMe: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userConditions = [
        {
          project: {
            ownerId: ctx.session.user.id,
          },
        },
        {
          project: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        {
          assignments: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      ];

      const where: Prisma.TaskWhereInput = isAdmin(ctx.session)
        ? {} // Admins see all tasks
        : { OR: userConditions };

      if (input.projectId) {
        where.projectId = input.projectId;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.priority) {
        where.priority = input.priority;
      }

      if (input.assignedToMe) {
        where.assignments = {
          some: {
            userId: ctx.session.user.id,
          },
        };
      }

      const tasks = await ctx.db.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          categories: true,
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
              subTasks: true,
            },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });

      return tasks;
    }),

  // Get a single task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userConditions = [
        {
          project: {
            ownerId: ctx.session.user.id,
          },
        },
        {
          project: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        {
          assignments: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      ];

      const whereCondition = isAdmin(ctx.session)
        ? { id: input.id } // Admins can access any task
        : { id: input.id, OR: userConditions };

      const task = await ctx.db.task.findFirst({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              ownerId: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          categories: true,
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          subTasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          attachments: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
          timeEntries: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: {
              startTime: "desc",
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you do not have access to it",
        });
      }

      return task;
    }),

  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Task title is required"),
        description: z.string().optional(),
        projectId: z.string(),
        parentTaskId: z.string().optional(),
        categoryId: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        status: z
          .enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"])
          .default("TODO"),
        dueDate: z.date().optional(),
        assigneeIds: z.array(z.string()).optional(),
        tagIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the project
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Check if user has access (owner, member, or admin)
      const isMember = await ctx.db.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      });

      const hasAccess =
        project.ownerId === ctx.session.user.id ||
        !!isMember ||
        isAdmin(ctx.session);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to create tasks in this project",
        });
      }

      // If parentTaskId is provided, check if it exists and belongs to the same project
      if (input.parentTaskId) {
        const parentTask = await ctx.db.task.findFirst({
          where: {
            id: input.parentTaskId,
            projectId: input.projectId,
          },
        });

        if (!parentTask) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent task not found in this project",
          });
        }
      }

      const { assigneeIds, tagIds, categoryId, ...taskData } = input;

      const task = await ctx.db.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          projectId: taskData.projectId,
          parentTaskId: taskData.parentTaskId,
          priority: taskData.priority,
          status: taskData.status,
          dueDate: taskData.dueDate,
          userId: ctx.session.user.id,
          assignments: assigneeIds
            ? {
                create: assigneeIds.map((userId) => ({
                  userId,
                  assignedAt: new Date(),
                })),
              }
            : undefined,
          tags: tagIds
            ? {
                create: tagIds.map((tagId) => ({
                  tagId,
                })),
              }
            : undefined,
          categories: categoryId
            ? {
                create: {
                  categoryId,
                },
              }
            : undefined,
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          categories: true,
        },
      });

      // Create activity log
      await ctx.db.taskActivity.create({
        data: {
          taskId: task.id,
          userId: ctx.session.user.id,
          action: "CREATED",
          description: `Task "${task.title}" was created`, // Changed from details to description
        },
      });

      return task;
    }),

  // Update a task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Task title is required").optional(),
        description: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        status: z
          .enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"])
          .optional(),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the task
      const existingTask = await ctx.db.task.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
          assignments: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!existingTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Check if user has access (project owner, member, assignee, or admin)
      const isMember = existingTask.projectId
        ? await ctx.db.projectMember.findFirst({
            where: {
              projectId: existingTask.projectId,
              userId: ctx.session.user.id,
            },
          })
        : null;

      const isAssignee = existingTask.assignments.some(
        (assignment) => assignment.userId === ctx.session.user.id,
      );

      const hasAccess =
        existingTask.project?.ownerId === ctx.session.user.id ||
        !!isMember ||
        isAssignee ||
        isAdmin(ctx.session);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this task",
        });
      }

      const { id, ...updateData } = input;
      const task = await ctx.db.task.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          categories: true,
        },
      });

      // Create activity log for significant changes
      if (input.status && input.status !== existingTask.status) {
        await ctx.db.taskActivity.create({
          data: {
            taskId: task.id,
            userId: ctx.session.user.id,
            action: "STATUS_CHANGED",
            description: `Status changed from ${existingTask.status} to ${input.status}`, // Changed from details to description
          },
        });
      }

      return task;
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the task
      const existingTask = await ctx.db.task.findFirst({
        where: {
          id: input.id,
        },
        include: {
          project: true,
        },
      });

      if (!existingTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Check if user has access (project owner, member, or admin)
      const isMember = existingTask.projectId
        ? await ctx.db.projectMember.findFirst({
            where: {
              projectId: existingTask.projectId,
              userId: ctx.session.user.id,
            },
          })
        : null;

      const hasAccess =
        existingTask.project?.ownerId === ctx.session.user.id ||
        !!isMember ||
        isAdmin(ctx.session);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this task",
        });
      }

      if (!existingTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you do not have permission to delete it",
        });
      }

      await ctx.db.task.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Assign users to a task
  assignUsers: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        userIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the task
      const userConditions = [
        {
          project: {
            ownerId: ctx.session.user.id,
          },
        },
        {
          project: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      ];

      const whereCondition = isAdmin(ctx.session)
        ? { id: input.taskId } // Admins can assign users to any task
        : { id: input.taskId, OR: userConditions };

      const task = await ctx.db.task.findFirst({
        where: whereCondition,
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Task not found or you do not have permission to assign users",
        });
      }

      // Remove existing assignments
      await ctx.db.taskAssignment.deleteMany({
        where: { taskId: input.taskId },
      });

      // Create new assignments
      if (input.userIds.length > 0) {
        await ctx.db.taskAssignment.createMany({
          data: input.userIds.map((userId) => ({
            taskId: input.taskId,
            userId,
            assignedAt: new Date(),
          })),
        });
      }

      return { success: true };
    }),

  // Add a comment to a task
  addComment: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        content: z.string().min(1, "Comment content is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the task
      const task = await ctx.db.task.findFirst({
        where: {
          id: input.taskId,
          OR: [
            {
              project: {
                ownerId: ctx.session.user.id,
              },
            },
            {
              project: {
                members: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
            {
              assignments: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          ],
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you do not have access to it",
        });
      }

      const comment = await ctx.db.taskComment.create({
        data: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          content: input.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Create activity log
      await ctx.db.taskActivity.create({
        data: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          action: "COMMENTED",
          description: "Added a comment", // Changed from details to description
        },
      });

      return comment;
    }),

  // Update a comment
  updateComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        content: z.string().min(1, "Comment content is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if comment exists and user owns it
      const comment = await ctx.db.taskComment.findFirst({
        where: {
          id: input.commentId,
          userId: ctx.session.user.id, // Only allow users to edit their own comments
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found or you do not have permission to edit it",
        });
      }

      const updatedComment = await ctx.db.taskComment.update({
        where: { id: input.commentId },
        data: { content: input.content },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Create activity log
      await ctx.db.taskActivity.create({
        data: {
          taskId: comment.task.id,
          userId: ctx.session.user.id,
          action: "COMMENT_UPDATED",
          description: "Updated a comment",
        },
      });

      return updatedComment;
    }),

  // Delete a comment
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if comment exists and user owns it or is admin/project owner
      const comment = await ctx.db.taskComment.findFirst({
        where: {
          id: input.commentId,
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check permissions: user owns the comment, is project owner, or is admin
      const canDelete =
        comment.userId === ctx.session.user.id ||
        comment.task.project?.ownerId === ctx.session.user.id ||
        isAdmin(ctx.session);

      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this comment",
        });
      }

      await ctx.db.taskComment.delete({
        where: { id: input.commentId },
      });

      // Create activity log
      await ctx.db.taskActivity.create({
        data: {
          taskId: comment.task.id,
          userId: ctx.session.user.id,
          action: "COMMENT_DELETED",
          description: "Deleted a comment",
        },
      });

      return { success: true };
    }),

  // Start time tracking for a task
  startTimeTracking: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the task
      const task = await ctx.db.task.findFirst({
        where: {
          id: input.taskId,
          OR: [
            {
              project: {
                ownerId: ctx.session.user.id,
              },
            },
            {
              project: {
                members: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
            {
              assignments: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          ],
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you do not have access to it",
        });
      }

      // Check if user already has an active time entry
      const activeEntry = await ctx.db.taskTimeEntry.findFirst({
        where: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          endTime: null,
        },
      });

      if (activeEntry) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an active time entry for this task",
        });
      }

      const timeEntry = await ctx.db.taskTimeEntry.create({
        data: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          description: input.description,
          startTime: new Date(),
        },
      });

      return timeEntry;
    }),

  // Stop time tracking for a task
  stopTimeTracking: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const activeEntry = await ctx.db.taskTimeEntry.findFirst({
        where: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          endTime: null,
        },
      });

      if (!activeEntry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active time entry found for this task",
        });
      }

      const endTime = new Date();
      const durationMinutes = Math.floor(
        (endTime.getTime() - activeEntry.startTime.getTime()) / (1000 * 60),
      );

      const timeEntry = await ctx.db.taskTimeEntry.update({
        where: { id: activeEntry.id },
        data: {
          endTime,
          duration: durationMinutes, // Changed from hours to duration in minutes
        },
      });

      return timeEntry;
    }),

  // Add attachment to a task
  addAttachment: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        filename: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the task
      const task = await ctx.db.task.findFirst({
        where: {
          id: input.taskId,
          OR: [
            {
              project: {
                ownerId: ctx.session.user.id,
              },
            },
            {
              project: {
                members: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
            {
              assignments: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          ],
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you do not have access to it",
        });
      }

      const attachment = await ctx.db.taskAttachment.create({
        data: {
          taskId: input.taskId,
          filename: input.filename,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        },
      });

      // Create activity log
      await ctx.db.taskActivity.create({
        data: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          action: "ATTACHMENT_ADDED",
          description: `Added attachment "${input.filename}"`,
        },
      });

      return attachment;
    }),

  // Remove attachment from a task
  removeAttachment: protectedProcedure
    .input(
      z.object({
        attachmentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get attachment with task info to check permissions
      const attachment = await ctx.db.taskAttachment.findFirst({
        where: { id: input.attachmentId },
        include: {
          task: {
            include: {
              project: true,
              assignments: true,
            },
          },
        },
      });

      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }

      // Check if user has access to the task
      const isMember = attachment.task.projectId
        ? await ctx.db.projectMember.findFirst({
            where: {
              projectId: attachment.task.projectId,
              userId: ctx.session.user.id,
            },
          })
        : null;

      const isAssignee = attachment.task.assignments.some(
        (assignment) => assignment.userId === ctx.session.user.id,
      );

      const hasAccess =
        attachment.task.project?.ownerId === ctx.session.user.id ||
        !!isMember ||
        isAssignee ||
        isAdmin(ctx.session);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to remove this attachment",
        });
      }

      await ctx.db.taskAttachment.delete({
        where: { id: input.attachmentId },
      });

      // Create activity log
      await ctx.db.taskActivity.create({
        data: {
          taskId: attachment.task.id,
          userId: ctx.session.user.id,
          action: "ATTACHMENT_REMOVED",
          description: `Removed attachment "${attachment.filename}"`,
        },
      });

      return { success: true };
    }),
});

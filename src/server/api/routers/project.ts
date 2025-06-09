import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { isAdmin, hasAdminOrResourceAccess } from "~/server/api/utils/admin";

export const projectRouter = createTRPCRouter({
  // Get all projects for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userConditions = [
        { ownerId: ctx.session.user.id },
        {
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      ];

      const whereCondition = isAdmin(ctx.session)
        ? {} // Admins see all projects
        : { OR: userConditions };

      const projects = await ctx.db.project.findMany({
        where: whereCondition,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          members: {
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
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch projects",
      });
    }
  }),

  // Get a single project by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const userConditions = [
          { ownerId: ctx.session.user.id },
          {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        ];

        const whereCondition = isAdmin(ctx.session)
          ? { id: input.id } // Admins can access any project
          : { id: input.id, OR: userConditions };

        const project = await ctx.db.project.findFirst({
          where: whereCondition,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            members: {
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
            tasks: {
              include: {
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
                categories: {
                  include: {
                    category: true,
                  },
                },
                _count: {
                  select: {
                    comments: true,
                    attachments: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            milestones: {
              orderBy: {
                dueDate: "asc",
              },
            },
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found or you do not have access to it",
          });
        }

        return project;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error fetching project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project",
        });
      }
    }),

  // Create a new project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Project name is required"),
        description: z.string().optional(),
        timeline: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const project = await ctx.db.project.create({
          data: {
            title: input.name, // Map name to title for database
            description: input.description,
            timeline: input.timeline,
            ownerId: ctx.session.user.id,
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        });

        return project;
      } catch (error) {
        console.error("Error creating project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }
    }),

  // Update a project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Project name is required").optional(),
        description: z.string().optional(),
        timeline: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user owns the project or is admin
        const existingProject = await ctx.db.project.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!existingProject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Check access permission
        if (!hasAdminOrResourceAccess(ctx.session, existingProject.ownerId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to update this project",
          });
        }

        const { id, name, ...otherUpdates } = input;
        const updateData: {
          title?: string;
          description?: string;
          timeline?: string;
        } = otherUpdates;

        // Map name to title if provided
        if (name) {
          updateData.title = name;
        }

        const project = await ctx.db.project.update({
          where: { id },
          data: updateData,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        });

        return project;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error updating project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project",
        });
      }
    }),

  // Delete a project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if project exists
        const existingProject = await ctx.db.project.findFirst({
          where: {
            id: input.id,
          },
        });

        if (!existingProject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Check access permission
        if (!hasAdminOrResourceAccess(ctx.session, existingProject.ownerId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to delete this project",
          });
        }

        await ctx.db.project.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error deleting project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project",
        });
      }
    }),

  // Add a member to a project
  addMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userEmail: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if project exists and user has permission
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

        // Check access permission
        if (!hasAdminOrResourceAccess(ctx.session, project.ownerId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have permission to add members to this project",
          });
        }

        // Find the user to add
        const userToAdd = await ctx.db.user.findUnique({
          where: { email: input.userEmail },
        });

        if (!userToAdd) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User with this email not found",
          });
        }

        // Check if user is already a member
        const existingMember = await ctx.db.projectMember.findFirst({
          where: {
            projectId: input.projectId,
            userId: userToAdd.id,
          },
        });

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this project",
          });
        }

        const member = await ctx.db.projectMember.create({
          data: {
            projectId: input.projectId,
            userId: userToAdd.id,
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

        return member;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error adding member:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add member",
        });
      }
    }),

  // Remove a member from a project
  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if project exists and user has permission
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

        // Check access permission
        if (!hasAdminOrResourceAccess(ctx.session, project.ownerId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have permission to remove members from this project",
          });
        }

        await ctx.db.projectMember.delete({
          where: {
            projectId_userId: {
              projectId: input.projectId,
              userId: input.userId,
            },
          },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error removing member:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove member",
        });
      }
    }),
});

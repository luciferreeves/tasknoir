import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { isAdmin, hasAdminOrResourceAccess } from "~/server/api/utils/admin";

export const milestoneRouter = createTRPCRouter({
  // Get all milestones for a project
  getByProjectId: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Check if user has access to the project
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            OR: isAdmin(ctx.session)
              ? undefined
              : [
                  { ownerId: ctx.session.user.id },
                  {
                    members: {
                      some: {
                        userId: ctx.session.user.id,
                      },
                    },
                  },
                ],
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found or you do not have access to it",
          });
        }

        const milestones = await ctx.db.milestone.findMany({
          where: { projectId: input.projectId },
          orderBy: { dueDate: "asc" },
        });

        return milestones;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching milestones:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch milestones",
        });
      }
    }),

  // Get a single milestone by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const milestone = await ctx.db.milestone.findFirst({
          where: {
            id: input.id,
            project: isAdmin(ctx.session)
              ? undefined
              : {
                  OR: [
                    { ownerId: ctx.session.user.id },
                    {
                      members: {
                        some: {
                          userId: ctx.session.user.id,
                        },
                      },
                    },
                  ],
                },
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                ownerId: true,
              },
            },
          },
        });

        if (!milestone) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Milestone not found or you do not have access to it",
          });
        }

        return milestone;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error fetching milestone:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch milestone",
        });
      }
    }),

  // Create a new milestone
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Milestone title is required"),
        description: z.string().optional(),
        projectId: z.string(),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has access to the project
        const project = await ctx.db.project.findFirst({
          where: { id: input.projectId },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        // Check access permission (owner, member, or admin)
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
            message:
              "You do not have permission to create milestones in this project",
          });
        }

        const milestone = await ctx.db.milestone.create({
          data: {
            title: input.title,
            description: input.description,
            projectId: input.projectId,
            dueDate: input.dueDate,
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        return milestone;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating milestone:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create milestone",
        });
      }
    }),

  // Update a milestone
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Milestone title is required").optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        completed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if milestone exists and user has access
        const existingMilestone = await ctx.db.milestone.findFirst({
          where: { id: input.id },
          include: {
            project: true,
          },
        });

        if (!existingMilestone) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Milestone not found",
          });
        }

        // Check access permission (project owner, member, or admin)
        const isMember = await ctx.db.projectMember.findFirst({
          where: {
            projectId: existingMilestone.projectId,
            userId: ctx.session.user.id,
          },
        });

        const hasAccess =
          existingMilestone.project.ownerId === ctx.session.user.id ||
          !!isMember ||
          isAdmin(ctx.session);

        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to update this milestone",
          });
        }

        const { id, ...updateData } = input;
        const milestone = await ctx.db.milestone.update({
          where: { id },
          data: updateData,
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        return milestone;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating milestone:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update milestone",
        });
      }
    }),

  // Delete a milestone
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if milestone exists and user has access
        const existingMilestone = await ctx.db.milestone.findFirst({
          where: { id: input.id },
          include: {
            project: true,
          },
        });

        if (!existingMilestone) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Milestone not found",
          });
        }

        // Check access permission (project owner or admin)
        if (
          !hasAdminOrResourceAccess(
            ctx.session,
            existingMilestone.project.ownerId,
          )
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to delete this milestone",
          });
        }

        await ctx.db.milestone.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting milestone:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete milestone",
        });
      }
    }),
});

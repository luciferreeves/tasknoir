import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { isAdmin } from "~/server/api/utils/admin";
import { deleteImageFromStorage } from "~/lib/supabase";

export const userRouter = createTRPCRouter({
  // Get all users that the current user can assign tasks to
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Admins can see all users
    if (ctx.session.user.role === "ADMIN") {
      const allUsers = await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          bio: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              ownedProjects: true,
              projectMembers: true,
              assignedTasks: true,
              ownedTasks: true,
            },
          },
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
      });
      return allUsers;
    }

    // Get users who are members of projects that the current user owns or is a member of
    const users = await ctx.db.user.findMany({
      where: {
        OR: [
          // Include the current user
          { id: ctx.session.user.id },
          // Include all admin users
          { role: "ADMIN" },
          // Include users who are members of projects owned by current user
          {
            projectMembers: {
              some: {
                project: {
                  ownerId: ctx.session.user.id,
                },
              },
            },
          },
          // Include users who are in the same projects as current user
          {
            projectMembers: {
              some: {
                project: {
                  members: {
                    some: {
                      userId: ctx.session.user.id,
                    },
                  },
                },
              },
            },
          },
          // Include owners of projects where current user is a member
          {
            ownedProjects: {
              some: {
                members: {
                  some: {
                    userId: ctx.session.user.id,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });

    // Remove duplicates based on id
    const uniqueUsers = users.filter(
      (user, index, self) => index === self.findIndex((u) => u.id === user.id),
    );

    return uniqueUsers;
  }),

  // Get user profile by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          bio: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              ownedProjects: true,
              projectMembers: true,
              assignedTasks: true,
              ownedTasks: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Update current user's profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").optional(),
        bio: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let oldImageUrl: string | null = null;

      // If updating image, get the old image URL first for cleanup
      if (input.image) {
        const currentUser = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { image: true },
        });
        oldImageUrl = currentUser?.image ?? null;
      }

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      });

      // Delete old image from storage if it exists and is different from new image
      if (oldImageUrl && input.image && oldImageUrl !== input.image) {
        // Don't await this - let it run in background to avoid blocking the response
        void deleteImageFromStorage(oldImageUrl);
      }

      return user;
    }),

  // Admin: Update any user's profile (admin only)
  updateUserProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        bio: z.string().optional(),
        image: z.string().optional(),
        emailVerified: z.boolean().optional(),
        role: z.enum(["USER", "ADMIN"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins can update other users
      if (!isAdmin(ctx.session)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update user profiles",
        });
      }

      const { id, ...updateData } = input;
      let oldImageUrl: string | null = null;

      // If updating image, get the old image URL first for cleanup
      if (updateData.image) {
        const currentUser = await ctx.db.user.findUnique({
          where: { id },
          select: { image: true },
        });
        oldImageUrl = currentUser?.image ?? null;
      }

      const user = await ctx.db.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              ownedProjects: true,
              projectMembers: true,
              assignedTasks: true,
              ownedTasks: true,
            },
          },
        },
      });

      // Delete old image from storage if it exists and is different from new image
      if (oldImageUrl && updateData.image && oldImageUrl !== updateData.image) {
        // Don't await this - let it run in background to avoid blocking the response
        void deleteImageFromStorage(oldImageUrl);
      }

      return user;
    }),

  // Get current user's profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            projectMembers: true,
            assignedTasks: true,
            ownedTasks: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Search users by email or name (for adding to projects)
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query is required"),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            {
              email: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: input.limit,
        orderBy: [{ name: "asc" }, { email: "asc" }],
      });

      return users;
    }),

  // Search users for mentions
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query is required"),
        projectId: z.string().optional(),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      // If projectId is provided, search only within project members
      if (input.projectId) {
        // Check if user has access to this project
        const project = await ctx.db.project.findFirst({
          where: {
            id: input.projectId,
            OR: [
              { ownerId: ctx.session.user.id },
              { members: { some: { userId: ctx.session.user.id } } },
            ],
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this project",
          });
        }

        // Search project members
        const users = await ctx.db.user.findMany({
          where: {
            OR: [
              { id: project.ownerId },
              {
                projectMembers: {
                  some: { projectId: input.projectId },
                },
              },
            ],
            AND: [
              {
                OR: [
                  { name: { contains: input.query, mode: "insensitive" } },
                  { email: { contains: input.query, mode: "insensitive" } },
                ],
              },
              { id: { not: ctx.session.user.id } }, // Exclude current user
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
          take: input.limit,
          orderBy: [{ name: "asc" }, { email: "asc" }],
        });

        return users;
      }

      // General search for users the current user can mention
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
          ],
          AND: [
            { id: { not: ctx.session.user.id } }, // Exclude current user
            // Only include users the current user has access to
            {
              OR: [
                // Members of projects owned by current user
                {
                  projectMembers: {
                    some: {
                      project: {
                        ownerId: ctx.session.user.id,
                      },
                    },
                  },
                },
                // Members of projects where current user is also a member
                {
                  projectMembers: {
                    some: {
                      project: {
                        members: {
                          some: {
                            userId: ctx.session.user.id,
                          },
                        },
                      },
                    },
                  },
                },
                // Owners of projects where current user is a member
                {
                  ownedProjects: {
                    some: {
                      members: {
                        some: {
                          userId: ctx.session.user.id,
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: input.limit,
        orderBy: [{ name: "asc" }, { email: "asc" }],
      });

      return users;
    }),
});

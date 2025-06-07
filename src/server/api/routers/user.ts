import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
});

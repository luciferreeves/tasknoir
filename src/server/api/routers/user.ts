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

  // Admin: Delete any user (admin only)
  deleteUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete other users
      if (!isAdmin(ctx.session)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete users",
        });
      }

      // Prevent admin from deleting themselves
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account using this endpoint",
        });
      }

      // Check if user exists
      const userToDelete = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          image: true,
          _count: {
            select: {
              ownedProjects: true,
              assignedTasks: true,
              ownedTasks: true,
            },
          },
        },
      });

      if (!userToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      try {
        // Use a transaction to ensure data consistency
        await ctx.db.$transaction(async (tx) => {
          // Transfer ownership of projects to the admin who is deleting the user
          if (userToDelete._count.ownedProjects > 0) {
            await tx.project.updateMany({
              where: { ownerId: input.id },
              data: { ownerId: ctx.session.user.id },
            });
          }

          // Remove user from project memberships
          await tx.projectMember.deleteMany({
            where: { userId: input.id },
          });

          // Remove user from task assignments
          await tx.taskAssignment.deleteMany({
            where: { userId: input.id },
          });

          // Delete user's time entries
          await tx.taskTimeEntry.deleteMany({
            where: { userId: input.id },
          });

          // Delete user's task activities
          await tx.taskActivity.deleteMany({
            where: { userId: input.id },
          });

          // Delete user's task comments
          await tx.taskComment.deleteMany({
            where: { userId: input.id },
          });

          // Transfer ownership of tasks to the admin
          if (userToDelete._count.ownedTasks > 0) {
            await tx.task.updateMany({
              where: { userId: input.id },
              data: { userId: ctx.session.user.id },
            });
          }

          // Finally, delete the user
          await tx.user.delete({
            where: { id: input.id },
          });
        });

        // Delete user's profile image from storage if it exists
        if (userToDelete.image) {
          void deleteImageFromStorage(userToDelete.image);
        }

        return { success: true, email: userToDelete.email };
      } catch (error) {
        console.error("Error deleting user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user",
        });
      }
    }),

  // Delete current user's account
  deleteMyAccount: protectedProcedure
    .input(
      z.object({
        confirmEmail: z.string().email("Please enter a valid email address"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify that the confirmation email matches the user's email
      if (input.confirmEmail !== ctx.session.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confirmation email does not match your account email",
        });
      }

      const userId = ctx.session.user.id;

      // Get user data before deletion
      const userToDelete = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          image: true,
          _count: {
            select: {
              ownedProjects: true,
            },
          },
        },
      });

      if (!userToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      try {
        // Use a transaction to ensure data consistency
        await ctx.db.$transaction(async (tx) => {
          // For owned projects, we need to handle them differently
          // Option 1: Delete projects with no other members, transfer ownership for projects with members
          const ownedProjects = await tx.project.findMany({
            where: { ownerId: userId },
            include: {
              members: true,
            },
          });

          for (const project of ownedProjects) {
            if (project.members.length === 0) {
              // No other members, delete the project and all its tasks
              await tx.task.deleteMany({
                where: { projectId: project.id },
              });
              await tx.project.delete({
                where: { id: project.id },
              });
            } else {
              // Transfer ownership to the first member
              const newOwnerId = project.members[0]?.userId;
              if (newOwnerId) {
                await tx.project.update({
                  where: { id: project.id },
                  data: { ownerId: newOwnerId },
                });
                // Remove the new owner from members (since they're now the owner)
                await tx.projectMember.delete({
                  where: {
                    projectId_userId: {
                      projectId: project.id,
                      userId: newOwnerId,
                    },
                  },
                });
              }
            }
          }

          // Remove user from project memberships
          await tx.projectMember.deleteMany({
            where: { userId },
          });

          // Remove user from task assignments
          await tx.taskAssignment.deleteMany({
            where: { userId },
          });

          // Delete user's time entries
          await tx.taskTimeEntry.deleteMany({
            where: { userId },
          });

          // Delete user's task activities
          await tx.taskActivity.deleteMany({
            where: { userId },
          });

          // Delete user's task comments
          await tx.taskComment.deleteMany({
            where: { userId },
          });

          // Delete tasks created by the user (orphaned tasks)
          await tx.task.deleteMany({
            where: {
              userId: userId,
              projectId: null, // Only delete tasks not associated with projects
            },
          });

          // For tasks in projects, transfer ownership to project owner
          const tasksInProjects = await tx.task.findMany({
            where: {
              userId: userId,
              projectId: { not: null },
            },
            select: {
              id: true,
              projectId: true,
            },
          });

          for (const task of tasksInProjects) {
            if (task.projectId) {
              // Get the project owner
              const project = await tx.project.findUnique({
                where: { id: task.projectId },
                select: { ownerId: true },
              });

              if (project) {
                await tx.task.update({
                  where: { id: task.id },
                  data: { userId: project.ownerId },
                });
              }
            }
          }

          // Finally, delete the user
          await tx.user.delete({
            where: { id: userId },
          });
        });

        // Delete user's profile image from storage if it exists
        if (userToDelete.image) {
          void deleteImageFromStorage(userToDelete.image);
        }

        return { success: true, email: userToDelete.email };
      } catch (error) {
        console.error("Error deleting user account:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete account",
        });
      }
    }),
});

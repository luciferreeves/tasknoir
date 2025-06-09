/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  createTestCaller,
  createAuthenticatedCaller,
  createAdminCaller,
  getGlobalMockPrisma,
  resetGlobalMockPrisma,
} from "~/test/trpc-helpers";
import { createMockUser, resetMocks } from "~/test/utils";

describe("userRouter", () => {
  beforeEach(() => {
    resetMocks();
    resetGlobalMockPrisma();
  });

  describe("getAll", () => {
    it("should return all users for admin", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const mockUsers = [
        createMockUser({ id: "user1", name: "User 1" }),
        createMockUser({ id: "user2", name: "User 2" }),
      ];

      mockPrisma.user.findMany.mockClear();
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await caller.user.getAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockUsers);
    });

    it("should return filtered users for regular user", async () => {
      const { caller } = createAuthenticatedCaller({
        user: {
          id: "user-id",
          role: "USER",
          name: "User",
          email: "user@example.com",
          image: null,
        },
      });
      const mockPrisma = getGlobalMockPrisma();
      const mockUsers = [createMockUser({ id: "user1", name: "User 1" })];

      mockPrisma.user.findMany.mockClear();
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await caller.user.getAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: "user-id" },
            { role: "ADMIN" },
            {
              projectMembers: {
                some: {
                  project: {
                    ownerId: "user-id",
                  },
                },
              },
            },
            {
              projectMembers: {
                some: {
                  project: {
                    members: {
                      some: {
                        userId: "user-id",
                      },
                    },
                  },
                },
              },
            },
            {
              ownedProjects: {
                some: {
                  members: {
                    some: {
                      userId: "user-id",
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
      expect(result).toEqual(mockUsers);
    });

    it("should throw error when not authenticated", async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.user.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getById", () => {
    it("should return user by id when user has access", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockUser = createMockUser({ id: "user1", name: "User 1" });

      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.getById({ id: "user1" });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user1" },
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
      expect(result).toEqual(mockUser);
    });

    it("should throw error when user not found", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(caller.user.getById({ id: "nonexistent" })).rejects.toThrow(
        "User account no longer exists",
      );
    });
  });

  describe("update", () => {
    it("should update user's own profile successfully", async () => {
      const { caller } = createAuthenticatedCaller({
        user: {
          id: "user-id",
          role: "USER",
          name: "User",
          email: "user@example.com",
          image: null,
        },
      });
      const mockPrisma = getGlobalMockPrisma();

      const updateData = {
        name: "Updated Name",
        bio: "Updated bio",
      };

      const updatedUser = {
        id: "user-id",
        name: "Updated Name",
        email: "user@example.com",
        image: null,
        bio: "Updated bio",
      };

      mockPrisma.user.update.mockClear();
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await caller.user.updateProfile(updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: {
          name: "Updated Name",
          bio: "Updated bio",
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it("should update user successfully when admin updates other user", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const updateData = {
        id: "user-id",
        name: "Updated Name",
        bio: "Updated bio",
      };

      const updatedUser = createMockUser({
        id: "user-id",
        name: "Updated Name",
        bio: "Updated bio",
      });

      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(
        createMockUser({ id: "user-id" }),
      );

      mockPrisma.user.update.mockClear();
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await caller.user.updateUserProfile(updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: {
          name: "Updated Name",
          bio: "Updated bio",
        },
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
      expect(result).toEqual(updatedUser);
    });

    it("should throw error when admin tries to update user that doesn't exist", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const updateData = {
        id: "nonexistent",
        name: "Updated Name",
      };

      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(caller.user.updateUserProfile(updateData)).rejects.toThrow(
        "User account no longer exists",
      );
    });

    it("should throw error when non-admin tries to update another user", async () => {
      const { caller } = createAuthenticatedCaller({
        user: {
          id: "user-id",
          role: "USER",
          name: "User",
          email: "user@example.com",
          image: null,
        },
      });

      const updateData = {
        id: "other-user-id",
        name: "Updated Name",
      };

      await expect(caller.user.updateUserProfile(updateData)).rejects.toThrow(
        "Only admins can update user profiles",
      );
    });

    it("should allow admin to update any user", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const updateData = {
        id: "other-user-id",
        name: "Updated Name",
        role: "ADMIN" as const,
      };

      const otherUser = createMockUser({ id: "other-user-id" });
      const updatedUser = createMockUser({
        id: "other-user-id",
        name: "Updated Name",
        role: "ADMIN",
      });

      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(otherUser);

      mockPrisma.user.update.mockClear();
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await caller.user.updateUserProfile(updateData);

      expect(result).toEqual(updatedUser);
    });
  });

  describe("delete", () => {
    it("should delete user successfully when user is admin", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const mockUser = createMockUser({
        id: "user1",
        email: "user1@example.com",
        _count: {
          ownedProjects: 1,
          assignedTasks: 2,
          ownedTasks: 1,
          projectMembers: 1,
        },
      });

      // Mock the user lookup
      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Mock transaction operations
      mockPrisma.project.updateMany.mockClear();
      mockPrisma.project.updateMany.mockResolvedValue({ count: 1 });

      mockPrisma.projectMember.deleteMany.mockClear();
      mockPrisma.projectMember.deleteMany.mockResolvedValue({ count: 1 });

      mockPrisma.taskAssignment.deleteMany.mockClear();
      mockPrisma.taskAssignment.deleteMany.mockResolvedValue({ count: 2 });

      mockPrisma.taskTimeEntry.deleteMany.mockClear();
      mockPrisma.taskTimeEntry.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.taskActivity.deleteMany.mockClear();
      mockPrisma.taskActivity.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.taskComment.deleteMany.mockClear();
      mockPrisma.taskComment.deleteMany.mockResolvedValue({ count: 0 });

      mockPrisma.task.updateMany.mockClear();
      mockPrisma.task.updateMany.mockResolvedValue({ count: 1 });

      mockPrisma.user.delete.mockClear();
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const result = await caller.user.deleteUser({ id: "user1" });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ success: true, email: mockUser.email });
    });

    it("should throw error when user not found", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.user.findUnique.mockClear();
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        caller.user.deleteUser({ id: "nonexistent" }),
      ).rejects.toThrow("User account no longer exists");
    });

    it("should throw error when non-admin tries to delete user", async () => {
      const { caller } = createAuthenticatedCaller({
        user: {
          id: "user-id",
          role: "USER",
          name: "User",
          email: "user@example.com",
          image: null,
        },
      });

      await expect(caller.user.deleteUser({ id: "user1" })).rejects.toThrow();
    });
  });
});

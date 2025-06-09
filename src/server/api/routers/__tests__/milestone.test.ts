/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  createAuthenticatedCaller,
  createAdminCaller,
  getGlobalMockPrisma,
  resetGlobalMockPrisma,
} from "~/test/trpc-helpers";
import {
  createMockProject,
  createMockMilestone,
  resetMocks,
} from "~/test/utils";

describe("milestoneRouter", () => {
  beforeEach(() => {
    resetMocks();
    resetGlobalMockPrisma();
  });

  describe("getByProjectId", () => {
    it("should return milestones for accessible project", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockMilestones = [
        createMockMilestone({ id: "milestone1", title: "Milestone 1" }),
        createMockMilestone({ id: "milestone2", title: "Milestone 2" }),
      ];

      // Mock project access check
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ ownerId: "test-user-id" }),
      );
      mockPrisma.milestone.findMany.mockResolvedValue(mockMilestones);

      const result = await caller.milestone.getByProjectId({
        projectId: "project1",
      });

      expect(result).toEqual(mockMilestones);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: "project1",
          OR: [
            { ownerId: "test-user-id" },
            {
              members: {
                some: {
                  userId: "test-user-id",
                },
              },
            },
          ],
        },
      });

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: {
          projectId: "project1",
        },
        orderBy: {
          dueDate: "asc",
        },
      });
    });

    it("should allow admin to access any project milestones", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockMilestones = [createMockMilestone()];

      // For admin, no OR condition should be applied
      mockPrisma.project.findFirst.mockResolvedValue(createMockProject());
      mockPrisma.milestone.findMany.mockResolvedValue(mockMilestones);

      const result = await caller.milestone.getByProjectId({
        projectId: "project1",
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: "project1",
        },
      });
      expect(result).toEqual(mockMilestones);
    });

    it("should throw error when project not accessible", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        caller.milestone.getByProjectId({ projectId: "project1" }),
      ).rejects.toThrow("Project not found or you do not have access to it");
    });
  });

  describe("getById", () => {
    it("should return milestone by id when user has access", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockMilestone = createMockMilestone({
        id: "milestone1",
        projectId: "project1",
      });

      mockPrisma.milestone.findFirst.mockResolvedValue(mockMilestone);

      const result = await caller.milestone.getById({ id: "milestone1" });

      expect(mockPrisma.milestone.findFirst).toHaveBeenCalledWith({
        where: {
          id: "milestone1",
          project: {
            OR: [
              { ownerId: "test-user-id" },
              {
                members: {
                  some: {
                    userId: "test-user-id",
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
      expect(result).toEqual(mockMilestone);
    });

    it("should throw error when milestone not found", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(
        caller.milestone.getById({ id: "milestone1" }),
      ).rejects.toThrow("Milestone not found or you do not have access to it");
    });
  });

  describe("create", () => {
    it("should create milestone successfully", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const milestoneData = {
        title: "New Milestone",
        description: "Milestone description",
        projectId: "project1",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      };
      const createdMilestone = createMockMilestone(milestoneData);

      // Mock project access check
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ id: "project1", ownerId: "test-user-id" }),
      );
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);
      mockPrisma.milestone.create.mockResolvedValue(createdMilestone);

      const result = await caller.milestone.create(milestoneData);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: "project1" },
      });

      expect(mockPrisma.milestone.create).toHaveBeenCalledWith({
        data: {
          title: "New Milestone",
          description: "Milestone description",
          projectId: "project1",
          dueDate: milestoneData.dueDate,
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
      expect(result).toEqual(createdMilestone);
    });

    it("should throw error when project not found", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const milestoneData = {
        title: "New Milestone",
        projectId: "project1",
        dueDate: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(caller.milestone.create(milestoneData)).rejects.toThrow(
        "Project not found",
      );
    });

    it("should validate required fields", async () => {
      const { caller } = createAuthenticatedCaller();

      await expect(
        caller.milestone.create({
          title: "", // Empty title should fail validation
          projectId: "project1",
          dueDate: new Date(),
        }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update milestone successfully", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const updateData = {
        id: "milestone1",
        title: "Updated Milestone",
        description: "Updated description",
        completed: true,
      };
      const updatedMilestone = createMockMilestone(updateData);

      // Mock milestone and project access check
      const mockMilestone = createMockMilestone({
        id: "milestone1",
        projectId: "project1",
        project: createMockProject({ ownerId: "test-user-id" }),
      });
      mockPrisma.milestone.findFirst.mockResolvedValue(mockMilestone);
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);
      mockPrisma.milestone.update.mockResolvedValue(updatedMilestone);

      const result = await caller.milestone.update(updateData);

      expect(mockPrisma.milestone.findFirst).toHaveBeenCalledWith({
        where: { id: "milestone1" },
        include: {
          project: true,
        },
      });

      expect(mockPrisma.milestone.update).toHaveBeenCalledWith({
        where: { id: "milestone1" },
        data: {
          title: "Updated Milestone",
          description: "Updated description",
          completed: true,
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
      expect(result).toEqual(updatedMilestone);
    });

    it("should throw error when milestone not found", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const updateData = {
        id: "milestone1",
        title: "Updated Milestone",
      };

      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(caller.milestone.update(updateData)).rejects.toThrow(
        "Milestone not found",
      );
    });

    it("should throw error when user has no access to project", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const updateData = {
        id: "milestone1",
        title: "Updated Milestone",
      };

      // Milestone exists but user has no access to project
      const mockMilestone = createMockMilestone({
        id: "milestone1",
        projectId: "project1",
        project: createMockProject({ ownerId: "other-user-id" }),
      });
      mockPrisma.milestone.findFirst.mockResolvedValue(mockMilestone);
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);

      await expect(caller.milestone.update(updateData)).rejects.toThrow(
        "You do not have permission to update this milestone",
      );
    });
  });

  describe("delete", () => {
    it("should delete milestone successfully", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockMilestone = createMockMilestone({
        id: "milestone1",
        projectId: "project1",
        project: createMockProject({ ownerId: "test-user-id" }),
      });

      // Mock milestone and project access check
      mockPrisma.milestone.findFirst.mockResolvedValue(mockMilestone);
      mockPrisma.milestone.delete.mockResolvedValue(mockMilestone);

      const result = await caller.milestone.delete({ id: "milestone1" });

      expect(mockPrisma.milestone.delete).toHaveBeenCalledWith({
        where: { id: "milestone1" },
      });
      expect(result).toEqual({ success: true });
    });

    it("should throw error when milestone not found", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.milestone.findFirst.mockResolvedValue(null);

      await expect(
        caller.milestone.delete({ id: "milestone1" }),
      ).rejects.toThrow("Milestone not found");
    });

    it("should throw error when user has no permission to delete", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      // Milestone exists but user has no access to project
      const mockMilestone = createMockMilestone({
        id: "milestone1",
        projectId: "project1",
        project: createMockProject({ ownerId: "other-user-id" }),
      });
      mockPrisma.milestone.findFirst.mockResolvedValue(mockMilestone);

      await expect(
        caller.milestone.delete({ id: "milestone1" }),
      ).rejects.toThrow("You do not have permission to delete this milestone");
    });
  });
});

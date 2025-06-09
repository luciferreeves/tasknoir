/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  createTestCaller,
  createAuthenticatedCaller,
  createAdminCaller,
  getGlobalMockPrisma,
  resetGlobalMockPrisma,
} from "~/test/trpc-helpers";
import { createMockProject, resetMocks } from "~/test/utils";

describe("projectRouter", () => {
  beforeEach(() => {
    resetMocks();
    resetGlobalMockPrisma();
  });

  describe("getAll", () => {
    it("should return all projects for admin", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockProjects = [
        createMockProject({ id: "project1", title: "Project 1" }),
        createMockProject({ id: "project2", title: "Project 2" }),
      ];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await caller.project.getAll();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {},
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
      expect(result).toEqual(mockProjects);
    });

    it("should return filtered projects for regular user", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockProjects = [createMockProject({ ownerId: "test-user-id" })];

      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await caller.project.getAll();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
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
        include: expect.any(Object),
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual(mockProjects);
    });

    it("should throw error when not authenticated", async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.project.getAll()).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getById", () => {
    it("should return project by id when user has access", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockProject = createMockProject({ id: "project1" });

      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      const result = await caller.project.getById({ id: "project1" });

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
        include: expect.any(Object),
      });
      expect(result).toEqual(mockProject);
    });

    it("should throw error when project not found", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        caller.project.getById({ id: "nonexistent" }),
      ).rejects.toThrow("Project not found or you do not have access to it");
    });
  });

  describe("create", () => {
    it("should create project successfully", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const projectData = {
        name: "New Project",
        description: "Test description",
        timeline: "Q1 2024",
      };
      const createdProject = createMockProject(projectData);

      mockPrisma.project.create.mockResolvedValue(createdProject);

      const result = await caller.project.create(projectData);

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          title: "New Project", // name maps to title
          description: "Test description",
          timeline: "Q1 2024",
          ownerId: "test-user-id",
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(createdProject);
    });

    it("should validate required fields", async () => {
      const { caller } = createAuthenticatedCaller();

      await expect(
        caller.project.create({
          name: "", // Empty name should fail validation
        }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update project successfully when user is owner", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const updateData = {
        id: "project1",
        name: "Updated Project",
        description: "Updated description",
      };
      const updatedProject = createMockProject(updateData);

      // Mock project access check
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ ownerId: "test-user-id" }),
      );
      mockPrisma.project.update.mockResolvedValue(updatedProject);

      const result = await caller.project.update(updateData);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: "project1",
        },
      });
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "project1" },
        data: {
          title: "Updated Project", // name maps to title
          description: "Updated description",
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedProject);
    });

    it("should throw error when project not accessible", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const updateData = {
        id: "project1",
        name: "Updated Project",
      };

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(caller.project.update(updateData)).rejects.toThrow(
        "Project not found",
      );
    });
  });

  describe("delete", () => {
    it("should delete project successfully when user is owner", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockProject = createMockProject({ ownerId: "test-user-id" });

      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);

      const result = await caller.project.delete({ id: "project1" });

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: "project1" },
      });
      expect(result).toEqual({ success: true });
    });

    it("should throw error when user is not owner and not admin", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockProject = createMockProject({ ownerId: "other-user-id" });

      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      await expect(caller.project.delete({ id: "project1" })).rejects.toThrow(
        "You do not have permission to delete this project",
      );
    });

    it("should allow admin to delete any project", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockProject = createMockProject({ ownerId: "other-user-id" });

      mockPrisma.project.findFirst.mockResolvedValue(mockProject);
      mockPrisma.project.delete.mockResolvedValue(mockProject);

      const result = await caller.project.delete({ id: "project1" });

      expect(result).toEqual({ success: true });
    });
  });

  describe("addMember", () => {
    it("should add member to project successfully", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const memberData = {
        projectId: "project1",
        userEmail: "member@example.com",
      };

      // Mock project ownership check
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ ownerId: "test-user-id" }),
      );

      // Mock user lookup
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "member-id",
        email: "member@example.com",
        name: "Member User",
        image: null,
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock existing member check
      mockPrisma.projectMember.findFirst.mockResolvedValue(null);

      const mockMembership = {
        id: "membership-id",
        projectId: "project1",
        userId: "member-id",
        joinedAt: new Date(),
        user: {
          id: "member-id",
          name: "Member User",
          email: "member@example.com",
          image: null,
        },
      };
      mockPrisma.projectMember.create.mockResolvedValue(mockMembership);

      const result = await caller.project.addMember(memberData);

      expect(result).toEqual(mockMembership);
    });

    it("should throw error when user is not project owner", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const memberData = {
        projectId: "project1",
        userEmail: "member@example.com",
      };

      // Project owned by different user
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ ownerId: "other-user-id" }),
      );

      await expect(caller.project.addMember(memberData)).rejects.toThrow(
        "You do not have permission to add members to this project",
      );
    });
  });

  describe("removeMember", () => {
    it("should remove member from project successfully", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const memberData = {
        projectId: "project1",
        userId: "member-id",
      };

      // Mock project ownership check
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ ownerId: "test-user-id" }),
      );

      const mockMembership = {
        id: "membership-id",
        projectId: "project1",
        userId: "member-id",
        joinedAt: new Date(),
      };
      mockPrisma.projectMember.delete.mockResolvedValue(mockMembership);

      const result = await caller.project.removeMember(memberData);

      expect(mockPrisma.projectMember.delete).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: "project1",
            userId: "member-id",
          },
        },
      });
      expect(result).toEqual({ success: true });
    });

    it("should throw error when user is not project owner", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();
      const memberData = {
        projectId: "project1",
        userId: "member-id",
      };

      // Project owned by different user
      mockPrisma.project.findFirst.mockResolvedValue(
        createMockProject({ ownerId: "other-user-id" }),
      );

      await expect(caller.project.removeMember(memberData)).rejects.toThrow(
        "You do not have permission to remove members from this project",
      );
    });
  });
});

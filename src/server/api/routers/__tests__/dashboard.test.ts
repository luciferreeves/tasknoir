/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// filepath: /home/lucifer/Documents/third-party-projects/task-noir/src/server/api/routers/__tests__/dashboard.test.ts
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  createTestCaller,
  createAuthenticatedCaller,
  createAdminCaller,
  getGlobalMockPrisma,
  resetGlobalMockPrisma,
} from "~/test/trpc-helpers";
import { createMockProject, createMockTask, resetMocks } from "~/test/utils";

describe("dashboardRouter", () => {
  beforeEach(() => {
    resetMocks();
    resetGlobalMockPrisma();
  });

  describe("getStats", () => {
    it("should return dashboard statistics for regular user", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      const mockProjects = [
        createMockProject({ id: "project1", ownerId: "test-user-id" }),
        createMockProject({ id: "project2", ownerId: "test-user-id" }),
      ];
      const mockTasks = [
        createMockTask({ id: "task1", status: "TODO", priority: "HIGH" }),
        createMockTask({
          id: "task2",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
        }),
        createMockTask({ id: "task3", status: "COMPLETED", priority: "LOW" }),
      ];
      const mockActivities = [
        {
          id: "activity1",
          action: "CREATED",
          description: "Task created",
          createdAt: new Date(),
          userId: "test-user-id",
          taskId: "task1",
          user: { id: "test-user-id", name: "Test User", image: null },
          task: {
            id: "task1",
            title: "Test Task",
            project: { id: "project1", title: "Test Project" },
          },
        },
      ];

      // Mock project queries
      mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      // Mock task queries
      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      // Mock activity queries
      mockPrisma.taskActivity.findMany.mockResolvedValue(mockActivities);

      const result = await caller.dashboard.getStats();

      // Verify the structure matches the actual router output
      expect(result).toEqual({
        taskStats: {
          total: 3,
          completed: 1,
          inProgress: 1,
          todo: 1,
          review: 0,
          overdue: 0,
          dueThisWeek: 0,
        },
        projectStats: {
          total: 2,
          owned: 2,
          member: 0,
        },
        priorityStats: {
          urgent: 0,
          high: 1,
          medium: 1,
          low: 0,
        },
        recentTasks: mockTasks.slice(0, 5),
        upcomingDeadlines: [],
        recentActivities: mockActivities,
        projects: mockProjects.slice(0, 4),
      });
    });

    it("should return all statistics for admin user", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const mockProjects = [
        createMockProject({ id: "project1" }),
        createMockProject({ id: "project2" }),
        createMockProject({ id: "project3" }),
      ];
      const mockTasks = [
        createMockTask({ id: "task1", status: "COMPLETED" }),
        createMockTask({ id: "task2", status: "IN_PROGRESS" }),
      ];

      // For admin, no where condition (empty object)
      mockPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockPrisma.task.findMany.mockResolvedValue(mockTasks);
      mockPrisma.taskActivity.findMany.mockResolvedValue([]);

      const result = await caller.dashboard.getStats();

      // Verify admin sees all projects (no where condition)
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      });

      expect(result).toHaveProperty("taskStats");
      expect(result).toHaveProperty("projectStats");
      expect(result).toHaveProperty("priorityStats");
    });

    it("should handle user with no projects", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      // User has no projects
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.taskActivity.findMany.mockResolvedValue([]);

      const result = await caller.dashboard.getStats();

      expect(result).toEqual({
        taskStats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
          review: 0,
          overdue: 0,
          dueThisWeek: 0,
        },
        projectStats: {
          total: 0,
          owned: 0,
          member: 0,
        },
        priorityStats: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        recentTasks: [],
        upcomingDeadlines: [],
        recentActivities: [],
        projects: [],
      });
    });

    it("should verify correct task filtering for regular users", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.taskActivity.findMany.mockResolvedValue([]);

      await caller.dashboard.getStats();

      // Verify tasks are filtered correctly for regular users
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              assignments: {
                some: {
                  userId: "test-user-id",
                },
              },
            },
            {
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
          ],
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
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    });

    it("should throw error when not authenticated", async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.dashboard.getStats()).rejects.toThrow("UNAUTHORIZED");
    });
  });
});

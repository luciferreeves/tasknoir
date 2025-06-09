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
import { createMockTask, createMockProject, resetMocks } from "~/test/utils";

describe("taskRouter", () => {
  beforeEach(() => {
    resetMocks();
    resetGlobalMockPrisma();
  });

  describe("getAll", () => {
    it("should return all tasks for admin", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const mockTasks = [
        createMockTask({ id: "task1", title: "Task 1" }),
        createMockTask({ id: "task2", title: "Task 2" }),
      ];

      mockPrisma.task.findMany.mockClear();
      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await caller.task.getAll({});

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });
      expect(result).toEqual(mockTasks);
    });

    it("should throw error when not authenticated", async () => {
      const { caller } = createTestCaller(null);

      await expect(caller.task.getAll({})).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("getById", () => {
    it("should return task by id when user has access", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();
      const mockTask = createMockTask({ id: "task1", title: "Task 1" });

      mockPrisma.task.findFirst.mockClear();
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      const result = await caller.task.getById({ id: "task1" });

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: "task1",
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTask);
    });

    it("should throw error when task not found", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      mockPrisma.task.findFirst.mockClear();
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(caller.task.getById({ id: "nonexistent" })).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("create", () => {
    it("should create task successfully", async () => {
      const { caller } = createAdminCaller();
      const mockPrisma = getGlobalMockPrisma();

      const taskData = {
        title: "New Task",
        projectId: "project1",
        priority: "MEDIUM" as const,
      };

      const mockProject = createMockProject({ id: "project1" });
      const createdTask = createMockTask({
        id: "new-task-id",
        title: "New Task",
        projectId: "project1",
      });

      mockPrisma.project.findFirst.mockClear();
      mockPrisma.project.findFirst.mockResolvedValue(mockProject);

      mockPrisma.task.create.mockClear();
      mockPrisma.task.create.mockResolvedValue(createdTask);

      mockPrisma.taskActivity.create.mockClear();
      mockPrisma.taskActivity.create.mockResolvedValue({
        id: "activity-1",
        taskId: "new-task-id",
        userId: "admin-id",
        action: "CREATED",
        description: `Task "${createdTask.title}" was created`,
        createdAt: new Date(),
      });

      const result = await caller.task.create(taskData);

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: "project1",
        },
      });
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "New Task",
          projectId: "project1",
          priority: "MEDIUM",
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(createdTask);
    });

    it("should throw error when project not found", async () => {
      const { caller } = createAuthenticatedCaller();
      const mockPrisma = getGlobalMockPrisma();

      const taskData = {
        title: "New Task",
        projectId: "project1",
        priority: "MEDIUM" as const,
      };

      mockPrisma.project.findFirst.mockClear();
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(caller.task.create(taskData)).rejects.toThrow(
        "Project not found",
      );
    });
  });
});

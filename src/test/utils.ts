/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Session } from "next-auth";
import { beforeEach, jest } from "@jest/globals";

// Mock Prisma client type that includes Jest mock methods
export type MockPrismaClient = {
  user: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    updateMany: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
    count: jest.MockedFunction<any>;
    aggregate: jest.MockedFunction<any>;
  };
  task: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    updateMany: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
    count: jest.MockedFunction<any>;
    aggregate: jest.MockedFunction<any>;
  };
  project: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    updateMany: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
    count: jest.MockedFunction<any>;
    aggregate: jest.MockedFunction<any>;
  };
  milestone: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findUnique: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    count: jest.MockedFunction<any>;
  };
  taskCategory: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
  };
  taskTag: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
  };
  taskComment: {
    create: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
  };
  taskTimeEntry: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
    aggregate: jest.MockedFunction<any>;
  };
  taskActivity: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
  };
  taskAssignment: {
    create: jest.MockedFunction<any>;
    createMany: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
  };
  taskAttachment: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
  };
  projectMember: {
    create: jest.MockedFunction<any>;
    findFirst: jest.MockedFunction<any>;
    findMany: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
    deleteMany: jest.MockedFunction<any>;
    count: jest.MockedFunction<any>;
    updateMany: jest.MockedFunction<any>;
  };
  $transaction: jest.MockedFunction<any>;
};

// Test database utilities
export const createTestPrismaClient = (): MockPrismaClient => {
  const mockPrisma: MockPrismaClient = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    milestone: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    taskCategory: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskTag: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskComment: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskTimeEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
    },
    taskActivity: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskAssignment: {
      create: jest.fn(),
      createMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskAttachment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((fn: any) => fn(mockPrisma)),
  };

  return mockPrisma;
};

// Test session helpers
export const createMockSession = (
  overrides: Partial<Session> = {},
): Session => ({
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    image: null,
    ...overrides.user,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

export const createMockAdminSession = (): Session =>
  createMockSession({
    user: {
      id: "admin-user-id",
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
      image: null,
    },
  });

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: "user-id",
  email: "user@example.com",
  name: "Test User",
  role: "USER",
  image: null,
  emailVerified: false,
  password: "hashed-password",
  bio: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: "project-id",
  title: "Test Project",
  description: "A test project",
  timeline: null,
  ownerId: "user-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: "task-id",
  title: "Test Task",
  description: "A test task",
  status: "TODO",
  priority: "MEDIUM",
  projectId: "project-id",
  userId: "user-id",
  parentTaskId: null,
  dueDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockMilestone = (overrides = {}) => ({
  id: "milestone-id",
  title: "Test Milestone",
  description: "A test milestone",
  projectId: "project-id",
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();
};

// Helper to reset test environment completely
export const resetTestEnvironment = () => {
  resetMocks();
  // Reset any global state if needed
};

// Setup function to run before each test
export const setupTest = () => {
  beforeEach(() => {
    resetMocks();
  });
};

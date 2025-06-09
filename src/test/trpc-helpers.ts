/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type Session } from "next-auth";
import { appRouter } from "~/server/api/root";
import {
  createMockSession,
  createTestPrismaClient,
  type MockPrismaClient,
} from "./utils";

// Global mock instance that can be shared across tests
let globalMockPrisma: MockPrismaClient | null = null;

// Helper to get or create the global mock instance
export const getGlobalMockPrisma = (): MockPrismaClient => {
  globalMockPrisma ??= createTestPrismaClient();
  return globalMockPrisma;
};

// Helper to reset the global mock instance
export const resetGlobalMockPrisma = () => {
  globalMockPrisma = null;
};

// Helper to create a test context for tRPC procedures
export const createTestContext = (session: Session | null = null) => {
  const mockPrisma = getGlobalMockPrisma();

  // Set up a default implementation for middleware user check
  // This will be called for authentication but won't interfere with test-specific mocks
  if (session?.user?.id) {
    // Store the original implementation if it exists
    const originalImpl = mockPrisma.user.findUnique.getMockImplementation();

    mockPrisma.user.findUnique.mockImplementation((args: any) => {
      // If looking for the current user (used by middleware), return the user
      if (args?.where?.id === session.user.id) {
        return Promise.resolve({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          image: session.user.image,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // For other queries, call the original implementation if it exists
      if (originalImpl) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalImpl(args);
      }

      // Default fallback
      return Promise.resolve(null);
    });
  }

  return {
    session,
    db: mockPrisma as any, // Type assertion to work with tRPC context
  };
};

// Helper to create a test caller for tRPC procedures
export const createTestCaller = (session: Session | null = null) => {
  const ctx = createTestContext(session);
  return {
    caller: appRouter.createCaller(ctx),
    mockPrisma: getGlobalMockPrisma(),
    ctx,
  };
};

// Helper for testing authenticated procedures
export const createAuthenticatedCaller = (sessionOverrides = {}) => {
  const session = createMockSession(sessionOverrides);
  return createTestCaller(session);
};

// Helper for testing admin procedures
export const createAdminCaller = () => {
  const session = createMockSession({
    user: {
      id: "admin-id",
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
      image: null,
    },
  });
  return createTestCaller(session);
};

// Test utilities for common operations
export const testProcedureWithAuth = async (
  procedureName: string,
  input: unknown,
  expectedResult?: unknown,
  sessionOverrides = {},
) => {
  const { caller } = createAuthenticatedCaller(sessionOverrides);

  // Extract nested procedure (e.g., 'user.getProfile' -> caller.user.getProfile)
  const procedurePath = procedureName.split(".");
  let procedure: any = caller;

  for (const path of procedurePath) {
    procedure = procedure[path];
  }

  const result = await procedure(input);

  if (expectedResult) {
    expect(result).toEqual(expectedResult);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result;
};

export const testProcedureWithoutAuth = async (
  procedureName: string,
  input: unknown,
) => {
  const { caller } = createTestCaller(null);

  const procedurePath = procedureName.split(".");
  let procedure: any = caller;

  for (const path of procedurePath) {
    procedure = procedure[path];
  }

  // This should throw an error for protected procedures
  await expect(procedure(input)).rejects.toThrow();
};

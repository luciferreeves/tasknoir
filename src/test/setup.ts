import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

Object.assign(process.env, {
  NODE_ENV: "test",
  NEXTAUTH_SECRET: "test-secret",
  NEXTAUTH_URL: "http://localhost:3000",
});

jest.mock("~/env", () => ({
  env: {
    NODE_ENV: "test",
    NEXTAUTH_SECRET: "test-secret",
    NEXTAUTH_URL: "http://localhost:3000",
  },
}));

// Mock superjson before any tRPC imports
jest.mock("superjson", () => ({
  stringify: jest.fn((obj: unknown) => JSON.stringify(obj)),
  parse: jest.fn((str: string) => JSON.parse(str) as unknown),
  serialize: jest.fn((obj: unknown) => ({ json: obj, meta: {} })),
  deserialize: jest.fn((obj: { json: unknown }) => obj.json),
  register: jest.fn(),
}));

// Mock the database before any other imports to prevent connection attempts
jest.mock("~/server/db", () => ({
  db: {
    // Mock Prisma client with empty methods
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  },
}));

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Global test timeout
jest.setTimeout(30000);

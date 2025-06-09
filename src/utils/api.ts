/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { signOut } from "next-auth/react";
import superjson from "superjson";

import { type AppRouter } from "~/server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          /**
           * Transformer used for data de-serialization from the server.
           *
           * @see https://trpc.io/docs/data-transformers
           */
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      /**
       * React Query configuration
       *
       * @see https://trpc.io/docs/react-query-config
       */
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: (failureCount, error: unknown) => {
              // Don't retry on UNAUTHORIZED errors - user should be logged out
              const tRPCError = error as { data?: { code?: string } };
              if (tRPCError?.data?.code === "UNAUTHORIZED") {
                // Force sign out on client side when user account no longer exists
                if (typeof window !== "undefined") {
                  void signOut({ redirect: true, callbackUrl: "/auth/signin" });
                }
                return false;
              }
              // Retry other errors up to 3 times
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: (failureCount, error: unknown) => {
              // Don't retry on UNAUTHORIZED errors
              const tRPCError = error as { data?: { code?: string } };
              if (tRPCError?.data?.code === "UNAUTHORIZED") {
                if (typeof window !== "undefined") {
                  void signOut({ redirect: true, callbackUrl: "/auth/signin" });
                }
                return false;
              }
              return false; // Don't retry mutations by default
            },
          },
        },
      },
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
  transformer: superjson,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

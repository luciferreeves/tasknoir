import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "~/utils/api";

/**
 * Custom hook to guard authenticated routes and handle deleted user accounts
 */
export function useAuthGuard(
  options: { redirectTo?: string; enabled?: boolean } = {},
) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { redirectTo = "/auth/signin", enabled = true } = options;

  // Check if current user still exists in the database
  const { error: userCheckError } = api.user.getMyProfile.useQuery(undefined, {
    enabled: enabled && !!session?.user?.id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!enabled) return;

    // If session is loading, wait
    if (status === "loading") return;

    // If no session, redirect to sign in
    if (!session) {
      void router.push(redirectTo);
      return;
    }

    // If user data is incomplete, sign out
    if (!session.user?.id || !session.user?.email) {
      void signOut({ redirect: true, callbackUrl: redirectTo });
      return;
    }

    // If user check failed with UNAUTHORIZED (user deleted), sign out
    if (userCheckError?.data?.code === "UNAUTHORIZED") {
      void signOut({ redirect: true, callbackUrl: redirectTo });
      return;
    }
  }, [session, status, router, redirectTo, userCheckError, enabled]);

  return {
    session,
    status,
    isAuthenticated: !!session?.user?.id,
    isLoading: status === "loading",
  };
}

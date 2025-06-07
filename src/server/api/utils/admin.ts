import type { Session } from "next-auth";

/**
 * Check if the current user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  console.log(
    "Admin check - session:",
    session?.user?.email,
    "role:",
    session?.user?.role,
  );
  const result = session?.user?.role === "ADMIN";
  console.log("Admin check result:", result);
  return result;
}

/**
 * Create admin OR condition for database queries
 * This allows admins to see all records while regular users see only their accessible records
 */
export function createAdminOrCondition<T>(
  session: Session,
  userConditions: T[],
): T[] {
  if (isAdmin(session)) {
    // Admins can see everything - return empty conditions array (no filtering)
    return [];
  }
  return userConditions;
}

/**
 * Check if user has admin access or owns/has access to a resource
 */
export function hasAdminOrResourceAccess(
  session: Session,
  resourceOwnerId: string,
  additionalConditions: boolean[] = [],
): boolean {
  if (isAdmin(session)) {
    return true;
  }

  const hasAccess =
    session.user.id === resourceOwnerId ||
    additionalConditions.some((condition) => condition);

  return hasAccess;
}

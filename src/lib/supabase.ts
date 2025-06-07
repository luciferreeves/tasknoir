import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

// Client-side Supabase client for browser operations
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseClient should only be called on the client side",
    );
  }

  if (!supabaseClient) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

// Server-side Supabase client with service role key for admin operations
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase admin environment variables are not configured");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

// Storage bucket name for avatars/profile images
export const STORAGE_BUCKET = "avatars";

// Utility function to extract filename from Supabase URL
export function extractFilenameFromUrl(url: string): string | null {
  try {
    // Extract filename from Supabase storage URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{filename}
    const urlParts = url.split("/");
    const bucketIndex = urlParts.findIndex((part) => part === STORAGE_BUCKET);
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      const filename = urlParts[bucketIndex + 1];
      return filename ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

// Utility function to delete an image from Supabase storage
export async function deleteImageFromStorage(
  imageUrl: string,
): Promise<boolean> {
  try {
    const filename = extractFilenameFromUrl(imageUrl);
    if (!filename) {
      console.warn("Could not extract filename from URL:", imageUrl);
      return false;
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filename]);

    if (error) {
      console.error("Failed to delete image from storage:", error);
      return false;
    }

    console.log("Successfully deleted image:", filename);
    return true;
  } catch (error) {
    console.error("Error deleting image from storage:", error);
    return false;
  }
}

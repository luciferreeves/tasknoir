import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import fs from "fs";
import { nanoid } from "nanoid";
import { getSupabaseAdmin, STORAGE_BUCKET } from "~/lib/supabase";

// Configure the API route to not parse the body as JSON
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadedFile {
  filepath: string;
  mimetype?: string | null;
  originalFilename?: string | null;
  size?: number;
}

// Function to ensure bucket exists
async function ensureBucketExists() {
  const supabase = getSupabaseAdmin();

  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(
    (bucket) => bucket.name === STORAGE_BUCKET,
  );

  if (!bucketExists) {
    console.log(`Creating bucket: ${STORAGE_BUCKET}`);
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      allowedMimeTypes: [
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        // Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Archives
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
      ],
      fileSizeLimit: 10485760, // 10MB
    });

    if (error) {
      console.error("Failed to create bucket:", error);
      throw new Error(`Failed to create bucket: ${error.message}`);
    }

    console.log(`Bucket ${STORAGE_BUCKET} created successfully`);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Ensure bucket exists
    await ensureBucketExists();

    // Parse the incoming form data
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Parse with proper error handling
    const [, files] = await new Promise<[unknown, Record<string, unknown>]>(
      (resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.parse(req, (err: any, fields: any, parsedFiles: any) => {
          if (err) {
            reject(new Error(String(err)));
          } else {
            resolve([fields, parsedFiles]);
          }
        });
      },
    );

    if (!files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Handle both single file and array of files
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const fileInput = fileArray[0] as UploadedFile;

    if (!fileInput?.filepath) {
      return res.status(400).json({ message: "Invalid file upload" });
    }

    // Validate file type
    const allowedTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ];

    const fileMimeType = fileInput.mimetype ?? "";
    if (!allowedTypes.includes(fileMimeType)) {
      return res.status(400).json({
        message:
          "Invalid file type. Supported types: PDF, Word, Excel, PowerPoint, images, text files, and archives.",
      });
    }

    // Read the file buffer
    const fileBuffer = fs.readFileSync(fileInput.filepath);

    // Generate a unique filename
    const originalFilename = fileInput.originalFilename ?? "unknown";
    const ext = originalFilename.split(".").pop() ?? "";
    const filename = `${nanoid()}.${ext}`;

    // Upload to Supabase Storage
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, fileBuffer, {
        contentType: fileMimeType,
        upsert: false,
      });

    // Clean up the temporary file
    try {
      fs.unlinkSync(fileInput.filepath);
    } catch {
      // File cleanup failed, but continue
    }

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ message: "Failed to upload file" });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);

    res.status(200).json({
      url: urlData.publicUrl,
      filename: originalFilename,
      size: fileInput.size,
      mimeType: fileMimeType,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/upload
 * Upload file to Supabase storage
 * Expects FormData with files in "files" field
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate total size (100MB limit)
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Total file size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size (25MB per file)
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 25MB limit` },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        // Video (community post walkthroughs) — still subject to the 25MB/file cap
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = file.name.split(".").pop();
      const filename = `${user.id}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload to Supabase Storage
      const buffer = await file.arrayBuffer();
      const { data, error } = await supabase.storage
        .from("community-uploads")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
          { error: "Failed to upload file" },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("community-uploads")
        .getPublicUrl(filename);

      uploadedFiles.push({
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        files: uploadedFiles,
        count: uploadedFiles.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireWorkMeAuth } from "@/lib/server/requireWorkMeAuth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    await requireWorkMeAuth(req);

    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Upload to Blob
    const key = `assets/${crypto.randomUUID()}-${file.name}`;
    const { url } = await put(key, file, { access: "public" });

    // Save asset in DB
    const asset = await prisma.asset.create({
      data: {
        url,
        filename: file.name,
        size: file.size,
        contentType: file.type,
        type: file.type.startsWith("image") ? "image" : "file"
      }
    });

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error("❌ POST /api/assets/store error:", error);
    
    // Handle auth errors
    if (error.message?.includes("Unauthorized") || error.message?.includes("authentication")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to upload asset" },
      { status: 500 }
    );
  }
}

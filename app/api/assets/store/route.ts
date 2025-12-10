import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file) {
    return new Response("No file provided", { status: 400 });
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

  return Response.json(asset);
}

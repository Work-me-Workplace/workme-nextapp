import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        title: body.title || undefined,
        description: body.description || undefined,
        tags: body.tags || undefined,
      },
    });

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error("Error fetching asset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

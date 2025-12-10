import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type");

  const whereConditions: any = {};
  
  if (q) {
    whereConditions.OR = [
      { filename: { contains: q } },
      { tags: { has: q } }
    ];
  }
  
  if (type) {
    whereConditions.type = type;
  }

  const assets = await prisma.asset.findMany({
    where: whereConditions,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return Response.json(assets);
}

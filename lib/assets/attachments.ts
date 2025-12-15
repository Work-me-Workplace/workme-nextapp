import { prisma } from "@/lib/prisma";

/**
 * WORKFLOW-OPS ARCHITECTURE:
 * Assets attach directly to ProductDigitalSign (the product), not to work packages.
 * Products are outcomes; work packages are effort.
 * 
 * Draft vs Final is represented via metadata on assets (e.g. stage, active, or similar),
 * not via separate attachment systems.
 */

/**
 * Attach an asset to a Digital Sign product
 * Assets attach to the product, not the work package.
 */
export async function attachAssetToDigitalSign(assetId: string, digitalSignId: string) {
  return await prisma.digitalSignAsset.create({
    data: {
      assetId,
      digitalSignId
    }
  });
}

/**
 * Get all assets for a Digital Sign product
 */
export async function getDigitalSignAssets(digitalSignId: string) {
  return await prisma.digitalSignAsset.findMany({
    where: { digitalSignId },
    include: { asset: true }
  });
}

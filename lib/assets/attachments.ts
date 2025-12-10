import { prisma } from "@/lib/prisma";

/**
 * Example: Attach an asset to a Digital Sign
 */
export async function attachAssetToDigitalSign(assetId: string, signageId: string) {
  return await prisma.digitalSignAsset.create({
    data: {
      assetId,
      signageId
    }
  });
}

/**
 * Example: Attach an asset to a Design Work Package
 */
export async function attachAssetToWorkPackage(assetId: string, packageId: string) {
  return await prisma.designWorkPackageAsset.create({
    data: {
      assetId,
      packageId
    }
  });
}

/**
 * Example: Get all assets for a Digital Sign
 */
export async function getDigitalSignAssets(signageId: string) {
  return await prisma.digitalSignAsset.findMany({
    where: { signageId },
    include: { asset: true }
  });
}

/**
 * Example: Get all assets for a Work Package
 */
export async function getWorkPackageAssets(packageId: string) {
  return await prisma.designWorkPackageAsset.findMany({
    where: { packageId },
    include: { asset: true }
  });
}

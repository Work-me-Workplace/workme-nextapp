"use client";

import { useState } from "react";
import { uploadAsset } from "@/lib/assets/uploadAsset";

interface Asset {
  id: string;
  url: string;
  filename: string | null;
  type: string | null;
}

interface AssetUploaderProps {
  onUploaded?: (asset: Asset) => void;
}

export function AssetUploader({ onUploaded }: AssetUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const uploaded = await uploadAsset(file);
      setLoading(false);
      setAsset(uploaded);
      onUploaded?.(uploaded);
    } catch (error) {
      setLoading(false);
      console.error("Upload failed:", error);
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" onChange={handleChange} />
      {loading && <p>Uploading…</p>}
      {asset && (
        <div className="border p-2 rounded">
          <p className="text-sm text-green-600">Upload successful!</p>
          {asset.type === "image" && (
            <img src={asset.url} className="h-24 rounded" alt={asset.filename || "Uploaded image"} />
          )}
          <p className="text-xs">{asset.filename}</p>
        </div>
      )}
    </div>
  );
}

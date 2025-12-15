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
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setAsset(null);
    
    try {
      const uploaded = await uploadAsset(file);
      setLoading(false);
      setAsset(uploaded);
      onUploaded?.(uploaded);
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error?.message || error?.toString() || "Upload failed. Please try again.";
      setError(errorMessage);
      console.error("Upload failed:", error);
    }
  }

  return (
    <div className="space-y-2">
      <input 
        type="file" 
        onChange={handleChange}
        accept="image/*"
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
      />
      {loading && (
        <p className="text-sm text-purple-600">Uploading…</p>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ {error}</p>
        </div>
      )}
      {asset && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium mb-2">✓ Upload successful!</p>
          {asset.type === "image" && (
            <img src={asset.url} className="h-24 rounded object-cover mb-2" alt={asset.filename || "Uploaded image"} />
          )}
          <p className="text-xs text-gray-600">{asset.filename}</p>
        </div>
      )}
    </div>
  );
}

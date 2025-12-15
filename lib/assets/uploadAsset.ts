export async function uploadAsset(file: File) {
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("/api/assets/store", {
      method: "POST",
      body: form
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Upload failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || `Upload failed with status ${res.status}`;
      }
      throw new Error(errorMessage);
    }

    const asset = await res.json();
    
    // Validate response has required fields
    if (!asset.id || !asset.url) {
      throw new Error("Invalid response from server: missing required fields");
    }

    return asset;
  } catch (error: any) {
    // Re-throw with better error message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || "Upload failed: unknown error");
  }
}

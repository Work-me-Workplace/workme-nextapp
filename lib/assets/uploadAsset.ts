export async function uploadAsset(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/assets/store", {
    method: "POST",
    body: form
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json(); // { id, url, ... }
}

import type { Id } from "../../convex/_generated/dataModel";

// Mirror of `imageUpload.ts` for the web build. Camera/library are
// not separable on the web file-picker — both `pickFromCamera` and
// `pickFromLibrary` open the browser's native file dialog, which on
// mobile web exposes the OS's own "Take Photo / Photo Library /
// Files" sheet. Compression is done on a `<canvas>`.

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.7;

export interface PickedImage {
  uri: string;
  mimeType: string;
}

export type PickSource = "camera" | "library";

function pickFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    let settled = false;
    const settle = (value: File | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    input.onchange = () => settle(input.files?.[0] ?? null);
    // Modern browsers fire "cancel" when the dialog closes without
    // a selection. Fall back to a focus-based heuristic for older
    // engines so the promise resolves either way.
    input.oncancel = () => settle(null);
    const onFocusBack = () => {
      window.removeEventListener("focus", onFocusBack);
      setTimeout(() => settle(null), 300);
    };
    window.addEventListener("focus", onFocusBack);
    input.click();
  });
}

async function fileToPicked(file: File): Promise<PickedImage> {
  const uri = URL.createObjectURL(file);
  return { uri, mimeType: file.type || "image/jpeg" };
}

export async function pickFromLibrary(_opts?: {
  square?: boolean;
}): Promise<PickedImage | null> {
  const file = await pickFile();
  return file ? fileToPicked(file) : null;
}

export async function pickFromCamera(_opts?: {
  square?: boolean;
}): Promise<PickedImage | null> {
  const file = await pickFile();
  return file ? fileToPicked(file) : null;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = uri;
  });
}

async function compress(picked: PickedImage): Promise<PickedImage> {
  const img = await loadImage(picked.uri);
  const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longEdge > MAX_DIMENSION ? MAX_DIMENSION / longEdge : 1;
  const targetW = Math.round(img.naturalWidth * scale);
  const targetH = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
  return { uri: URL.createObjectURL(blob), mimeType: "image/jpeg" };
}

async function uploadToConvex(
  uploadUrl: string,
  file: PickedImage,
): Promise<Id<"_storage">> {
  const blob = await (await fetch(file.uri)).blob();
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.mimeType },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }
  const json = (await res.json()) as { storageId: Id<"_storage"> };
  return json.storageId;
}

export async function pickCompressUpload(opts: {
  generateUploadUrl: () => Promise<string>;
  source: PickSource;
  square?: boolean;
}): Promise<{ storageId: Id<"_storage">; previewUri: string } | null> {
  const picked = await pickFromLibrary({ square: opts.square });
  if (!picked) return null;
  const compressed = await compress(picked);
  const uploadUrl = await opts.generateUploadUrl();
  const storageId = await uploadToConvex(uploadUrl, compressed);
  return { storageId, previewUri: compressed.uri };
}

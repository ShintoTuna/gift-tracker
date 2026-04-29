import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import type { Id } from "../../convex/_generated/dataModel";

// Compression target. 1024px on the long edge keeps avatars sharp on
// the largest device (Profile hero is 56pt) and idea thumbnails crisp
// on Retina (60pt thumb, 240px@4x). 0.7 JPEG quality lands files at
// well under 200KB for typical photos — gentle on Convex storage and
// over slow networks.
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.7;

export interface PickedImage {
  uri: string;
  mimeType: string;
}

// Asks for media-library permission, opens the system picker, and
// resolves to the chosen asset (or null if the user cancels or
// declines permission). Square aspect for avatars; pass `false` to
// allow free-form crops on idea images.
export async function pickFromLibrary(opts?: {
  square?: boolean;
}): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: opts?.square ? [1, 1] : undefined,
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" };
}

// Resizes the long edge to MAX_DIMENSION and re-encodes as JPEG so
// the upload payload stays small. Returns a new file URI.
async function compress(picked: PickedImage): Promise<PickedImage> {
  const result = await ImageManipulator.manipulateAsync(
    picked.uri,
    [{ resize: { width: MAX_DIMENSION } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return { uri: result.uri, mimeType: "image/jpeg" };
}

// Uploads a local file URI to a Convex-issued upload URL and returns
// the resulting storage id. The PUT body is the image bytes; Convex's
// upload endpoint responds with `{ storageId }` on success.
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

// Convenience pipeline: pick → compress → upload. Returns the
// storage id (and a local preview URI the caller can render before
// the next reactive query refresh) or null if the user cancelled
// the picker.
export async function pickCompressUpload(opts: {
  generateUploadUrl: () => Promise<string>;
  square?: boolean;
}): Promise<{ storageId: Id<"_storage">; previewUri: string } | null> {
  const picked = await pickFromLibrary({ square: opts.square });
  if (!picked) return null;
  const compressed = await compress(picked);
  const uploadUrl = await opts.generateUploadUrl();
  const storageId = await uploadToConvex(uploadUrl, compressed);
  return { storageId, previewUri: compressed.uri };
}

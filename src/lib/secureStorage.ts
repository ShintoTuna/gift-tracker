import * as SecureStore from "expo-secure-store";

// SecureStore on Android (EncryptedSharedPreferences) caps each value
// at ~2 KB and throws/crashes natively when exceeded. iOS Keychain has
// hit similar walls in the wild. Convex Auth's JWT + refresh-token
// payload can sail past that on a fresh OAuth sign-in, which kills
// the app process the moment ConvexAuthProvider tries to persist.
//
// This adapter splits every value into N chunks stored under
// `<key>__0`..`<key>__N-1`, with `<key>__count` holding N. Reads
// reassemble in order; writes overwrite stale chunks first so the
// previous value's tail can't bleed into a shorter new value.
//
// CHUNK_SIZE is character-count, not byte-count. Convex Auth tokens
// are base64-ish ASCII so 1 char = 1 byte; 1024 leaves comfortable
// headroom under the 2 KB platform limit even if a future token
// format starts mixing in multi-byte characters.
const CHUNK_SIZE = 1024;
const COUNT_SUFFIX = "__count";

async function readCount(key: string): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

async function deleteChunks(key: string, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${key}__${i}`);
  }
  await SecureStore.deleteItemAsync(`${key}${COUNT_SUFFIX}`);
}

export const chunkedSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await readCount(key);
    if (count !== null) {
      let result = "";
      for (let i = 0; i < count; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}__${i}`);
        if (chunk === null) return null;
        result += chunk;
      }
      return result;
    }
    // Legacy fallback: an older build wrote this key as a single
    // value. Read-through so existing sessions survive the upgrade;
    // the next setItem will rewrite in chunked format.
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const oldCount = await readCount(key);
    if (oldCount !== null) {
      await deleteChunks(key, oldCount);
    }
    // Drop any legacy single-value entry left over from the old
    // adapter so we don't keep two sources of truth.
    await SecureStore.deleteItemAsync(key).catch(() => {});

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}__${i}`, chunks[i]);
    }
    // Write the count last so a partial write is detectable: if we
    // crash mid-setItem, getItem sees no count and returns null
    // rather than reassembling a torn value.
    await SecureStore.setItemAsync(
      `${key}${COUNT_SUFFIX}`,
      String(chunks.length),
    );
  },

  async removeItem(key: string): Promise<void> {
    const count = await readCount(key);
    if (count !== null) {
      await deleteChunks(key, count);
    }
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },
};

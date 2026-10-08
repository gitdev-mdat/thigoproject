import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = fileURLToPath(
  new URL("../../storage/media", import.meta.url)
);

/** Where uploaded images are written; MEDIA_STORAGE_DIR must be absolute when set. */
export function readMediaStorageDirectory(env: NodeJS.ProcessEnv): string {
  const configured = env.MEDIA_STORAGE_DIR?.trim();
  if (!configured) return defaultRoot;
  if (!isAbsolute(configured))
    throw new Error("MEDIA_STORAGE_DIR must be an absolute path.");
  return resolve(configured);
}

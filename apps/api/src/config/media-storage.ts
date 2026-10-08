import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = fileURLToPath(
  new URL("../../storage/media", import.meta.url)
);

/**
 * Where uploaded images are written; MEDIA_STORAGE_DIR must be absolute when
 * set. Production must set it to a persistent volume: the default sits inside
 * the deployed app folder, which a redeploy replaces.
 */
export function readMediaStorageDirectory(env: NodeJS.ProcessEnv): string {
  const configured = env.MEDIA_STORAGE_DIR?.trim();
  if (!configured) {
    if (env.NODE_ENV === "production")
      throw new Error(
        "MEDIA_STORAGE_DIR is required in production and must point to a persistent volume."
      );
    return defaultRoot;
  }
  if (!isAbsolute(configured))
    throw new Error("MEDIA_STORAGE_DIR must be an absolute path.");
  return resolve(configured);
}

/** Fails the API start when the media directory cannot be created or written. */
export async function assertMediaStorageWritable(root: string): Promise<void> {
  const probe = join(root, `.write-check-${randomUUID()}`);
  try {
    await mkdir(root, { recursive: true });
    await writeFile(probe, "ok", { flag: "wx" });
  } catch (error) {
    throw new Error(
      `MEDIA_STORAGE_DIR ${root} is not writable: ${(error as Error).message}`,
      { cause: error }
    );
  } finally {
    await rm(probe, { force: true }).catch(() => undefined);
  }
}

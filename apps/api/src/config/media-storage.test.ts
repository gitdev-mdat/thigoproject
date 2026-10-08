import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertMediaStorageWritable,
  readMediaStorageDirectory
} from "./media-storage.js";

describe("media storage directory", () => {
  it("requires an absolute directory in production", () => {
    expect(() => readMediaStorageDirectory({ NODE_ENV: "production" })).toThrow(
      "persistent volume"
    );
    expect(() =>
      readMediaStorageDirectory({
        NODE_ENV: "production",
        MEDIA_STORAGE_DIR: "media"
      })
    ).toThrow("absolute");
    expect(
      readMediaStorageDirectory({
        NODE_ENV: "production",
        MEDIA_STORAGE_DIR: "/var/lib/thigo/media"
      })
    ).toBe("/var/lib/thigo/media");
    expect(readMediaStorageDirectory({ NODE_ENV: "development" })).toMatch(
      /storage[\\/]media$/
    );
  });

  it("checks the directory is writable and leaves nothing behind", async () => {
    const root = await mkdtemp(join(tmpdir(), "thigo-media-"));
    await assertMediaStorageWritable(root);
    expect(await readdir(root)).toEqual([]);
    const file = join(root, "not-a-dir");
    await writeFile(file, "x");
    await expect(assertMediaStorageWritable(file)).rejects.toThrow(
      "not writable"
    );
  });
});

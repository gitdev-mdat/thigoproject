import { createReadStream, type ReadStream } from "node:fs";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { readMediaStorageDirectory } from "../../config/media-storage.js";

/**
 * Keeps uploaded image bytes on the API's local disk, one file per media id.
 * Swapping in object storage later only replaces this class.
 */
@Injectable()
export class MediaFileStore {
  private readonly root = readMediaStorageDirectory(process.env);

  async write(id: string, bytes: Buffer): Promise<void> {
    await mkdir(this.root, { recursive: true });
    const temporary = join(this.root, `.${id}.uploading`);
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, this.path(id));
  }

  async open(id: string): Promise<ReadStream | null> {
    const path = this.path(id);
    try {
      await stat(path);
    } catch {
      return null;
    }
    return createReadStream(path);
  }

  async remove(id: string): Promise<void> {
    await unlink(this.path(id)).catch(() => undefined);
  }

  private path(id: string): string {
    return join(this.root, id);
  }
}

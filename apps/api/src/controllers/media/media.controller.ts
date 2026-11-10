import { Controller, Get, Param, Res, StreamableFile } from "@nestjs/common";
import type { Response } from "express";
import { MediaService } from "../../services/media/media.service.js";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Store and product images are public catalog content; ids are unguessable UUIDs. */
  @Get(":id")
  async read(
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    const { asset, stream } = await this.media.open(id);
    // Set only once the file exists, so a 404 is never cached as immutable.
    response.set({
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox"
    });
    return new StreamableFile(stream, {
      type: asset.contentType,
      length: asset.byteSize
    });
  }
}

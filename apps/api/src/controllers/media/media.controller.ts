import { Controller, Get, Header, Param, StreamableFile } from "@nestjs/common";
import { MediaService } from "../../services/media/media.service.js";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Store and product images are public catalog content; ids are unguessable UUIDs. */
  @Get(":id")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  @Header("X-Content-Type-Options", "nosniff")
  async read(@Param("id") id: string): Promise<StreamableFile> {
    const { asset, stream } = await this.media.open(id);
    return new StreamableFile(stream, {
      type: asset.contentType,
      length: asset.byteSize
    });
  }
}

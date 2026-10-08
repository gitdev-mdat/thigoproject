import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { MediaAsset } from "../../entities/media/media-asset.entity.js";

@Injectable()
export class MediaRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  create(values: Omit<MediaAsset, "id" | "createdAt">): Promise<MediaAsset> {
    return this.db
      .getRepository(MediaAsset)
      .save(this.db.getRepository(MediaAsset).create(values));
  }

  find(id: string): Promise<MediaAsset | null> {
    return this.db.getRepository(MediaAsset).findOne({ where: { id } });
  }

  findForStore(id: string, storeId: string): Promise<MediaAsset | null> {
    return this.db
      .getRepository(MediaAsset)
      .findOne({ where: { id, storeId } });
  }

  countForStore(storeId: string): Promise<number> {
    return this.db.getRepository(MediaAsset).count({ where: { storeId } });
  }

  async remove(id: string): Promise<void> {
    await this.db.getRepository(MediaAsset).delete({ id });
  }
}

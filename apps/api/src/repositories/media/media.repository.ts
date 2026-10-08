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

  /** Whether any store, product (archived included) or order line still shows this URL. */
  async isReferenced(url: string): Promise<boolean> {
    const rows = (await this.db.query(
      `SELECT EXISTS (SELECT 1 FROM stores WHERE logo_image_url = $1 OR cover_image_url = $1)
           OR EXISTS (SELECT 1 FROM products WHERE image_url = $1)
           OR EXISTS (SELECT 1 FROM order_items WHERE image_url = $1) AS used`,
      [url]
    )) as { used: boolean }[];
    return rows[0]?.used ?? true;
  }

  async remove(id: string): Promise<void> {
    await this.db.getRepository(MediaAsset).delete({ id });
  }
}

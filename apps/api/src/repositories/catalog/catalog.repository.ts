import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In, type SelectQueryBuilder } from "typeorm";
import {
  VIETNAMESE_FOLD_FROM,
  VIETNAMESE_FOLD_TO
} from "../../common/text/vietnamese-fold.js";
import { MenuCategory } from "../../entities/catalog/menu-category.entity.js";
import { Product } from "../../entities/catalog/product.entity.js";
import { Store, StoreCategory } from "../../entities/catalog/store.entity.js";

export interface StoreWithCount {
  store: Store;
  productCount: number;
}

function folded(column: string): string {
  return `lower(translate(${column}, :foldFrom, :foldTo))`;
}

@Injectable()
export class CatalogRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async listActiveStores(
    filter: { category?: StoreCategory; foldedQuery?: string } = {}
  ): Promise<StoreWithCount[]> {
    const query = this.db
      .getRepository(Store)
      .createQueryBuilder("s")
      .addSelect(
        (sub) =>
          sub
            .select("COUNT(*)::int")
            .from(Product, "p")
            .innerJoin(MenuCategory, "c", "c.id = p.category_id")
            .where(
              "p.store_id = s.id AND p.is_available AND p.archived_at IS NULL AND c.is_active"
            ),
        "product_count"
      )
      .where("s.is_active = true")
      .orderBy("s.name", "ASC");
    if (filter.category)
      query.andWhere("s.category = :category", { category: filter.category });
    if (filter.foldedQuery)
      this.matchFolded(query, ["s.name"], filter.foldedQuery);
    const { entities, raw } = await query.getRawAndEntities<{
      product_count: number;
    }>();
    return entities.map((store, index) => ({
      store,
      productCount: Number(raw[index]?.product_count ?? 0)
    }));
  }

  async listAvailableProducts(
    filter: { category?: StoreCategory; foldedQuery?: string },
    limit: number
  ): Promise<Product[]> {
    const query = this.db
      .getRepository(Product)
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.store", "s")
      .innerJoin("p.category", "c")
      .where(
        "p.is_available AND p.archived_at IS NULL AND c.is_active AND s.is_active"
      )
      .orderBy("c.position", "ASC")
      .addOrderBy("p.position", "ASC")
      .addOrderBy("s.name", "ASC")
      .addOrderBy("p.name", "ASC")
      // Only many-to-one joins, so LIMIT cannot cut a product in half.
      .limit(limit);
    if (filter.category)
      query.andWhere("s.category = :category", { category: filter.category });
    if (filter.foldedQuery)
      this.matchFolded(
        query,
        ["p.name", "COALESCE(p.description, '')"],
        filter.foldedQuery
      );
    return query.getMany();
  }

  async findActiveStoreMenu(id: string): Promise<Store | null> {
    return this.db.getRepository(Store).findOne({
      where: { id, isActive: true },
      relations: {
        categories: { products: { optionGroups: { options: true } } }
      },
      order: {
        categories: {
          position: "ASC",
          products: {
            position: "ASC",
            optionGroups: { position: "ASC", options: { position: "ASC" } }
          }
        }
      }
    });
  }

  findStoreByOwner(ownerUserId: string): Promise<Store | null> {
    return this.db.getRepository(Store).findOne({ where: { ownerUserId } });
  }

  /** Products of one store with their category and options, for pricing a cart. */
  findStoreProducts(storeId: string, productIds: string[]): Promise<Product[]> {
    if (!productIds.length) return Promise.resolve([]);
    return this.db.getRepository(Product).find({
      where: { storeId, id: In(productIds) },
      relations: { category: true, optionGroups: { options: true } }
    });
  }

  findStore(id: string): Promise<Store | null> {
    return this.db.getRepository(Store).findOne({ where: { id } });
  }

  private matchFolded<T extends object>(
    query: SelectQueryBuilder<T>,
    columns: string[],
    foldedQuery: string
  ): void {
    const pattern = `%${foldedQuery.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    query.andWhere(
      `(${columns.map((column) => `${folded(column)} LIKE :pattern`).join(" OR ")})`,
      { pattern, foldFrom: VIETNAMESE_FOLD_FROM, foldTo: VIETNAMESE_FOLD_TO }
    );
  }
}

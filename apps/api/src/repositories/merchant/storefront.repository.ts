import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, IsNull, type EntityManager } from "typeorm";
import { MenuCategory } from "../../entities/catalog/menu-category.entity.js";
import { Product } from "../../entities/catalog/product.entity.js";
import { Store } from "../../entities/catalog/store.entity.js";
import { OrderItem } from "../../entities/ordering/order-item.entity.js";

/** The constraint name that a duplicate write ran into, if any. */
export function uniqueViolation(error: unknown): string | null {
  const driverError = (
    error as { driverError?: { code?: string; constraint?: string } }
  ).driverError;
  return driverError?.code === "23505" ? (driverError.constraint ?? "") : null;
}

export type NewStore = Pick<
  Store,
  | "ownerUserId"
  | "slug"
  | "name"
  | "category"
  | "description"
  | "addressLine"
  | "phone"
>;

export type StorePatch = Partial<
  Pick<
    Store,
    | "name"
    | "category"
    | "description"
    | "addressLine"
    | "phone"
    | "logoImageUrl"
    | "coverImageUrl"
    | "isActive"
    | "isAcceptingOrders"
    | "openingHours"
  >
>;

export type ProductValues = Pick<
  Product,
  | "categoryId"
  | "name"
  | "description"
  | "priceVnd"
  | "isAvailable"
  | "imageUrl"
>;

export interface CatalogCounts {
  categoryCount: number;
  productCount: number;
  availableCount: number;
  /** Available products in visible categories: what customers can order. */
  orderableCount: number;
}

/** Writes and reads one merchant's storefront and catalog, always scoped by store. */
@Injectable()
export class StorefrontRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  findStoreByOwner(ownerUserId: string): Promise<Store | null> {
    return this.db.getRepository(Store).findOne({ where: { ownerUserId } });
  }

  /** Returns null when this owner already has a store (or the slug is taken). */
  async createStore(values: NewStore): Promise<Store | null> {
    try {
      return await this.db
        .getRepository(Store)
        .save(
          this.db
            .getRepository(Store)
            .create({ ...values, isActive: false, isAcceptingOrders: true })
        );
    } catch (error) {
      if (uniqueViolation(error) !== null) return null;
      throw error;
    }
  }

  async updateStore(id: string, patch: StorePatch): Promise<Store> {
    await this.db.getRepository(Store).update({ id }, patch);
    return this.db.getRepository(Store).findOneByOrFail({ id });
  }

  async counts(storeId: string): Promise<CatalogCounts> {
    const row = await this.db
      .getRepository(Product)
      .createQueryBuilder("p")
      .innerJoin("p.category", "c")
      .select("COUNT(*)::int", "productCount")
      .addSelect(
        "COUNT(*) FILTER (WHERE p.is_available)::int",
        "availableCount"
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE p.is_available AND c.is_active)::int",
        "orderableCount"
      )
      .where("p.store_id = :storeId AND p.archived_at IS NULL", { storeId })
      .getRawOne<Omit<CatalogCounts, "categoryCount">>();
    const categoryCount = await this.db
      .getRepository(MenuCategory)
      .count({ where: { storeId } });
    return {
      categoryCount,
      productCount: Number(row?.productCount ?? 0),
      availableCount: Number(row?.availableCount ?? 0),
      orderableCount: Number(row?.orderableCount ?? 0)
    };
  }

  /** Categories in order with their live (non-archived) products. */
  async catalog(storeId: string): Promise<MenuCategory[]> {
    const categories = await this.db.getRepository(MenuCategory).find({
      where: { storeId },
      order: { position: "ASC", createdAt: "ASC" }
    });
    const products = await this.db.getRepository(Product).find({
      where: { storeId, archivedAt: IsNull() },
      relations: { optionGroups: true },
      order: { position: "ASC", createdAt: "ASC" }
    });
    for (const category of categories)
      category.products = products.filter(
        (product) => product.categoryId === category.id
      );
    return categories;
  }

  findCategory(storeId: string, id: string): Promise<MenuCategory | null> {
    return this.db
      .getRepository(MenuCategory)
      .findOne({ where: { id, storeId } });
  }

  /** Returns null when the store already has a category with this name. */
  async createCategory(
    storeId: string,
    name: string
  ): Promise<MenuCategory | null> {
    try {
      return await this.db.transaction(async (manager) => {
        const position = await nextPosition(manager, MenuCategory, { storeId });
        return manager
          .getRepository(MenuCategory)
          .save(
            manager
              .getRepository(MenuCategory)
              .create({ storeId, name, position, isActive: true })
          );
      });
    } catch (error) {
      if (uniqueViolation(error) !== null) return null;
      throw error;
    }
  }

  /** Returns null on a duplicate name. */
  async updateCategory(
    storeId: string,
    id: string,
    patch: Partial<Pick<MenuCategory, "name" | "isActive">>
  ): Promise<MenuCategory | null> {
    try {
      await this.db.getRepository(MenuCategory).update({ id, storeId }, patch);
    } catch (error) {
      if (uniqueViolation(error) !== null) return null;
      throw error;
    }
    return this.db.getRepository(MenuCategory).findOneByOrFail({ id, storeId });
  }

  /** Swaps with the neighbour above or below; false when already at the edge. */
  moveCategory(storeId: string, id: string, direction: "up" | "down") {
    return this.db.transaction((manager) =>
      swapWithNeighbour(manager, MenuCategory, { storeId }, id, direction)
    );
  }

  /** Deletes only an empty category; archived products still count. */
  async deleteEmptyCategory(storeId: string, id: string): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const inUse = await manager
        .getRepository(Product)
        .exists({ where: { storeId, categoryId: id } });
      if (inUse) return false;
      const result = await manager
        .getRepository(MenuCategory)
        .delete({ id, storeId });
      return result.affected === 1;
    });
  }

  findProduct(storeId: string, id: string): Promise<Product | null> {
    return this.db.getRepository(Product).findOne({
      where: { id, storeId, archivedAt: IsNull() },
      relations: { optionGroups: true }
    });
  }

  /** Returns null on a duplicate live product name. */
  async createProduct(
    storeId: string,
    values: ProductValues
  ): Promise<Product | null> {
    try {
      const id = await this.db.transaction(async (manager) => {
        const position = await nextPosition(manager, Product, {
          storeId,
          categoryId: values.categoryId
        });
        const saved = await manager
          .getRepository(Product)
          .save(
            manager
              .getRepository(Product)
              .create({ ...values, storeId, position })
          );
        return saved.id;
      });
      return this.findProduct(storeId, id);
    } catch (error) {
      if (uniqueViolation(error) !== null) return null;
      throw error;
    }
  }

  /** Returns null on a duplicate live product name. Moving category puts it last. */
  async updateProduct(
    storeId: string,
    product: Product,
    patch: Partial<ProductValues>
  ): Promise<Product | null> {
    try {
      await this.db.transaction(async (manager) => {
        const values: Partial<Product> = { ...patch };
        if (patch.categoryId && patch.categoryId !== product.categoryId)
          values.position = await nextPosition(manager, Product, {
            storeId,
            categoryId: patch.categoryId
          });
        await manager
          .getRepository(Product)
          .update({ id: product.id, storeId, archivedAt: IsNull() }, values);
      });
    } catch (error) {
      if (uniqueViolation(error) !== null) return null;
      throw error;
    }
    return this.findProduct(storeId, product.id);
  }

  moveProduct(storeId: string, product: Product, direction: "up" | "down") {
    return this.db.transaction((manager) =>
      swapWithNeighbour(
        manager,
        Product,
        { storeId, categoryId: product.categoryId, archivedAt: null },
        product.id,
        direction
      )
    );
  }

  /**
   * Products that past orders mention are archived so history keeps its link;
   * never-ordered products are deleted.
   */
  async removeProduct(
    storeId: string,
    id: string
  ): Promise<"archived" | "deleted"> {
    return this.db.transaction(async (manager) => {
      const ordered = await manager
        .getRepository(OrderItem)
        .exists({ where: { productId: id } });
      if (ordered) {
        await manager
          .getRepository(Product)
          .update(
            { id, storeId, archivedAt: IsNull() },
            { archivedAt: new Date(), isAvailable: false }
          );
        return "archived";
      }
      await manager.getRepository(Product).delete({ id, storeId });
      return "deleted";
    });
  }
}

async function nextPosition(
  manager: EntityManager,
  entity: typeof MenuCategory | typeof Product,
  where: Record<string, string>
): Promise<number> {
  const query = manager
    .getRepository(entity)
    .createQueryBuilder("row")
    .select("COALESCE(MAX(row.position), -1) + 1", "next");
  for (const [key, value] of Object.entries(where))
    query.andWhere(`row.${key} = :${key}`, { [key]: value });
  const row = await query.getRawOne<{ next: number }>();
  return Number(row?.next ?? 0);
}

async function swapWithNeighbour(
  manager: EntityManager,
  entity: typeof MenuCategory | typeof Product,
  scope: Record<string, string | null>,
  id: string,
  direction: "up" | "down"
): Promise<boolean> {
  const query = manager
    .getRepository(entity)
    .createQueryBuilder("row")
    .select(["row.id", "row.position"])
    .orderBy("row.position", "ASC")
    .addOrderBy("row.created_at", "ASC")
    .setLock("pessimistic_write");
  for (const [key, value] of Object.entries(scope))
    if (value === null) query.andWhere(`row.${key} IS NULL`);
    else query.andWhere(`row.${key} = :${key}`, { [key]: value });
  const rows = (await query.getMany()) as { id: string; position: number }[];
  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return false;
  // Renumber densely so ties from older rows cannot block a move.
  [rows[index], rows[target]] = [rows[target]!, rows[index]!];
  for (const [position, row] of rows.entries())
    if (row.position !== position)
      await manager.getRepository(entity).update({ id: row.id }, { position });
  return true;
}

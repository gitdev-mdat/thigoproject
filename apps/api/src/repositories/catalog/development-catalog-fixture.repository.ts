import type { EntityManager } from "typeorm";
import {
  ApplicationRole,
  UserRole
} from "../../entities/auth/user-role.entity.js";
import { User } from "../../entities/auth/user.entity.js";
import { MenuCategory } from "../../entities/catalog/menu-category.entity.js";
import { ProductOptionGroup } from "../../entities/catalog/product-option-group.entity.js";
import { ProductOption } from "../../entities/catalog/product-option.entity.js";
import { Product } from "../../entities/catalog/product.entity.js";
import { Store } from "../../entities/catalog/store.entity.js";
import type {
  DevelopmentCatalogWriter,
  OptionGroupFixture,
  ProductFixture,
  StoreFixture
} from "../../development/catalog-fixtures.js";

/** Upserts development catalog rows inside the caller's transaction. */
export class DevelopmentCatalogFixtureRepository implements DevelopmentCatalogWriter {
  constructor(private readonly manager: EntityManager) {}

  async ensureMerchant(phone: string): Promise<string> {
    await this.manager
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ phone })
      .orIgnore()
      .execute();
    const user = await this.manager
      .getRepository(User)
      .findOneByOrFail({ phone });
    await this.manager
      .createQueryBuilder()
      .insert()
      .into(UserRole)
      .values({ userId: user.id, role: ApplicationRole.MERCHANT })
      .orIgnore()
      .execute();
    return user.id;
  }

  upsertStore(
    fixture: StoreFixture,
    ownerUserId: string,
    coverImageUrl: string
  ): Promise<string> {
    return this.upsert(
      Store,
      {
        slug: fixture.slug,
        ownerUserId,
        name: fixture.name,
        category: fixture.category,
        description: fixture.description,
        addressLine: fixture.addressLine,
        coverImageUrl,
        isActive: true
      },
      ["slug"]
    );
  }

  upsertCategory(
    storeId: string,
    name: string,
    position: number
  ): Promise<string> {
    return this.upsert(
      MenuCategory,
      { storeId, name, position, isActive: true },
      ["store_id", "name"]
    );
  }

  upsertProduct(
    storeId: string,
    categoryId: string,
    fixture: ProductFixture,
    imageUrl: string,
    position: number
  ): Promise<string> {
    return this.upsert(
      Product,
      {
        storeId,
        categoryId,
        name: fixture.name,
        description: fixture.description,
        priceVnd: fixture.priceVnd,
        imageUrl,
        isAvailable: fixture.isAvailable ?? true,
        position
      },
      ["store_id", "name"]
    );
  }

  upsertOptionGroup(
    productId: string,
    fixture: OptionGroupFixture,
    position: number
  ): Promise<string> {
    return this.upsert(
      ProductOptionGroup,
      {
        productId,
        name: fixture.name,
        minSelect: fixture.minSelect,
        maxSelect: fixture.maxSelect,
        position
      },
      ["product_id", "name"]
    );
  }

  async upsertOption(
    groupId: string,
    name: string,
    priceDeltaVnd: number,
    position: number
  ): Promise<void> {
    await this.upsert(
      ProductOption,
      { groupId, name, priceDeltaVnd, position, isAvailable: true },
      ["group_id", "name"]
    );
  }

  private async upsert<T extends object>(
    entity: new () => T,
    values: Partial<T>,
    conflict: string[]
  ): Promise<string> {
    const columns = this.manager
      .getRepository(entity)
      .metadata.columns.filter(
        (column) =>
          column.propertyName in values &&
          !conflict.includes(column.databaseName)
      )
      .map((column) => column.databaseName);
    const result = await this.manager
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(values as never)
      .orUpdate(columns, conflict)
      .returning("id")
      .execute();
    return (result.raw as { id: string }[])[0]!.id;
  }
}

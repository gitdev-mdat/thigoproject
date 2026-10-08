import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type {
  CategoryUpdateInput,
  MerchantCatalogDto,
  MerchantCategoryDto,
  MerchantProductDto,
  ProductInput,
  ProductUpdateInput
} from "../../dto/merchant/storefront.dto.js";
import { isUuid } from "../../dto/merchant/storefront.dto.js";
import type { MenuCategory } from "../../entities/catalog/menu-category.entity.js";
import type { Product } from "../../entities/catalog/product.entity.js";
import {
  StorefrontRepository,
  type ProductValues
} from "../../repositories/merchant/storefront.repository.js";
import { MediaService } from "../media/media.service.js";
import { StorefrontService } from "./storefront.service.js";

const MAX_CATEGORIES = 30;
const DUPLICATE_CATEGORY = "Đã có danh mục cùng tên.";
const DUPLICATE_PRODUCT = "Đã có món cùng tên trong cửa hàng.";

export function toMerchantProduct(product: Product): MerchantProductDto {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    priceVnd: product.priceVnd,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    optionGroupCount: product.optionGroups?.length ?? 0
  };
}

function toMerchantCategory(category: MenuCategory): MerchantCategoryDto {
  return {
    id: category.id,
    name: category.name,
    isActive: category.isActive,
    products: (category.products ?? []).map(toMerchantProduct)
  };
}

/** Every operation resolves the store from the session; ids from the client are only looked up inside it. */
@Injectable()
export class MerchantCatalogService {
  constructor(
    private readonly storefront: StorefrontRepository,
    private readonly stores: StorefrontService,
    private readonly media: MediaService
  ) {}

  async catalog(userId: string): Promise<MerchantCatalogDto> {
    const store = await this.stores.ownStore(userId);
    const categories = await this.storefront.catalog(store.id);
    return { categories: categories.map(toMerchantCategory) };
  }

  async createCategory(
    userId: string,
    name: string
  ): Promise<MerchantCatalogDto> {
    const store = await this.stores.ownStore(userId);
    const { categoryCount } = await this.storefront.counts(store.id);
    if (categoryCount >= MAX_CATEGORIES)
      throw new BadRequestException(`Tối đa ${MAX_CATEGORIES} danh mục.`);
    if (!(await this.storefront.createCategory(store.id, name)))
      throw new ConflictException(DUPLICATE_CATEGORY);
    return this.catalog(userId);
  }

  async updateCategory(userId: string, id: string, input: CategoryUpdateInput) {
    const store = await this.stores.ownStore(userId);
    await this.category(store.id, id);
    if (!(await this.storefront.updateCategory(store.id, id, input)))
      throw new ConflictException(DUPLICATE_CATEGORY);
    return this.catalog(userId);
  }

  async moveCategory(userId: string, id: string, direction: "up" | "down") {
    const store = await this.stores.ownStore(userId);
    await this.category(store.id, id);
    await this.storefront.moveCategory(store.id, id, direction);
    return this.catalog(userId);
  }

  async deleteCategory(userId: string, id: string) {
    const store = await this.stores.ownStore(userId);
    await this.category(store.id, id);
    if (!(await this.storefront.deleteEmptyCategory(store.id, id)))
      throw new ConflictException(
        "Danh mục còn món hoặc có món đã từng được đặt nên không thể xoá. Hãy chuyển món đang bán sang danh mục khác, hoặc ẩn danh mục."
      );
    return this.catalog(userId);
  }

  async createProduct(
    userId: string,
    input: ProductInput
  ): Promise<MerchantProductDto> {
    const store = await this.stores.ownStore(userId);
    await this.category(store.id, input.categoryId);
    const { imageMediaId, ...rest } = input;
    const values: ProductValues = {
      ...rest,
      imageUrl: imageMediaId
        ? await this.media.ownedUrl(store.id, imageMediaId)
        : null
    };
    const product = await this.storefront.createProduct(store.id, values);
    if (!product) throw new ConflictException(DUPLICATE_PRODUCT);
    return toMerchantProduct(product);
  }

  async updateProduct(
    userId: string,
    id: string,
    input: ProductUpdateInput
  ): Promise<MerchantProductDto> {
    const store = await this.stores.ownStore(userId);
    const product = await this.product(store.id, id);
    if (input.categoryId) await this.category(store.id, input.categoryId);
    const { imageMediaId, ...rest } = input;
    const patch: Partial<ProductValues> = { ...rest };
    if (imageMediaId !== undefined)
      patch.imageUrl =
        imageMediaId === null
          ? null
          : await this.media.ownedUrl(store.id, imageMediaId);
    const updated = await this.storefront.updateProduct(
      store.id,
      product,
      patch
    );
    if (!updated) throw new ConflictException(DUPLICATE_PRODUCT);
    return toMerchantProduct(updated);
  }

  async moveProduct(userId: string, id: string, direction: "up" | "down") {
    const store = await this.stores.ownStore(userId);
    const product = await this.product(store.id, id);
    await this.storefront.moveProduct(store.id, product, direction);
    return this.catalog(userId);
  }

  async removeProduct(userId: string, id: string) {
    const store = await this.stores.ownStore(userId);
    await this.product(store.id, id);
    const outcome = await this.storefront.removeProduct(store.id, id);
    return { outcome, catalog: await this.catalog(userId) };
  }

  private async category(storeId: string, id: string): Promise<MenuCategory> {
    const category = isUuid(id)
      ? await this.storefront.findCategory(storeId, id)
      : null;
    if (!category) throw new NotFoundException("Không tìm thấy danh mục.");
    return category;
  }

  private async product(storeId: string, id: string): Promise<Product> {
    const product = isUuid(id)
      ? await this.storefront.findProduct(storeId, id)
      : null;
    if (!product) throw new NotFoundException("Không tìm thấy món.");
    return product;
  }
}

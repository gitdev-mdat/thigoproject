import { Injectable, NotFoundException } from "@nestjs/common";
import { storeClosedReason } from "../../common/catalog/store-availability.js";
import { foldVietnamese } from "../../common/text/vietnamese-fold.js";
import type {
  DishSummaryDto,
  HomeShortcutDto,
  ProductDto,
  RecommendationsDto,
  SearchDto,
  StoreDetailDto,
  StoreSummaryDto
} from "../../dto/catalog/catalog.dto.js";
import type { Product } from "../../entities/catalog/product.entity.js";
import {
  type Store,
  StoreCategory
} from "../../entities/catalog/store.entity.js";
import {
  CatalogRepository,
  type StoreWithCount
} from "../../repositories/catalog/catalog.repository.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECOMMENDED_DISH_LIMIT = 8;
const SEARCH_DISH_LIMIT = 20;
export const MAX_SEARCH_LENGTH = 60;

export const HOME_SHORTCUTS: HomeShortcutDto[] = [
  { key: StoreCategory.FOOD, label: "Đồ ăn" },
  { key: StoreCategory.COFFEE, label: "Cà phê" },
  { key: StoreCategory.MILK_TEA, label: "Trà sữa" }
];

export function parseStoreCategory(value: unknown): StoreCategory | undefined {
  return Object.values(StoreCategory).find((category) => category === value);
}

@Injectable()
export class CustomerCatalogService {
  constructor(private readonly catalog: CatalogRepository) {}

  async recommendations(category: StoreCategory): Promise<RecommendationsDto> {
    const [stores, dishes] = await Promise.all([
      this.catalog.listActiveStores({ category }),
      this.catalog.listAvailableProducts({ category }, RECOMMENDED_DISH_LIMIT)
    ]);
    return {
      category,
      stores: stores.filter((item) => item.productCount > 0).map(toSummary),
      dishes: dishes.map(toDish)
    };
  }

  async search(raw: string): Promise<SearchDto> {
    const query = raw.trim().slice(0, MAX_SEARCH_LENGTH);
    const foldedQuery = foldVietnamese(query);
    if (!foldedQuery) return { query, stores: [], dishes: [] };
    const [stores, dishes] = await Promise.all([
      this.catalog.listActiveStores({ foldedQuery }),
      this.catalog.listAvailableProducts({ foldedQuery }, SEARCH_DISH_LIMIT)
    ]);
    return {
      query,
      stores: stores.filter((item) => item.productCount > 0).map(toSummary),
      dishes: dishes.map(toDish)
    };
  }

  async store(id: string): Promise<StoreDetailDto> {
    const store = UUID.test(id)
      ? await this.catalog.findActiveStoreMenu(id)
      : null;
    if (!store) throw new NotFoundException("Không tìm thấy cửa hàng.");
    const categories = store.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => !product.archivedAt)
      }))
      .filter((category) => category.isActive && category.products.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        products: category.products.map(toProduct)
      }));
    const productCount = categories
      .flatMap((category) => category.products)
      .filter((product) => product.isAvailable).length;
    const summary = toSummary({ store, productCount });
    return {
      ...summary,
      isOpen: summary.isOpen && productCount > 0,
      phone: store.phone,
      openingHours: store.openingHours,
      categories
    };
  }
}

function toSummary({ store, productCount }: StoreWithCount): StoreSummaryDto {
  const closedReason = storeClosedReason(store);
  return {
    id: store.id,
    name: store.name,
    category: store.category,
    description: store.description,
    addressLine: store.addressLine,
    coverImageUrl: store.coverImageUrl,
    logoImageUrl: store.logoImageUrl,
    productCount,
    isOpen: closedReason === null,
    closedReason
  };
}

function toDish(product: Product & { store: Store }): DishSummaryDto {
  return {
    id: product.id,
    storeId: product.storeId,
    storeName: product.store.name,
    name: product.name,
    description: product.description,
    priceVnd: product.priceVnd,
    imageUrl: product.imageUrl
  };
}

function toProduct(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceVnd: product.priceVnd,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    optionGroups: product.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDeltaVnd: option.priceDeltaVnd,
        isAvailable: option.isAvailable
      }))
    }))
  };
}

import type { StoreClosedReason } from "../../common/catalog/store-availability.js";
import {
  StoreCategory,
  type OpeningHours
} from "../../entities/catalog/store.entity.js";

export interface StoreSummaryDto {
  id: string;
  name: string;
  category: StoreCategory;
  description: string | null;
  addressLine: string;
  coverImageUrl: string | null;
  logoImageUrl: string | null;
  productCount: number;
  /** Whether the store takes orders right now (published, not paused, within hours). */
  isOpen: boolean;
  closedReason: StoreClosedReason | null;
}

export interface DishSummaryDto {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string | null;
  priceVnd: number;
  imageUrl: string | null;
}

export interface ProductOptionDto {
  id: string;
  name: string;
  priceDeltaVnd: number;
  isAvailable: boolean;
}

export interface ProductOptionGroupDto {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ProductOptionDto[];
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  priceVnd: number;
  imageUrl: string | null;
  isAvailable: boolean;
  optionGroups: ProductOptionGroupDto[];
}

export interface StoreDetailDto extends StoreSummaryDto {
  phone: string | null;
  openingHours: OpeningHours | null;
  categories: { id: string; name: string; products: ProductDto[] }[];
}

export interface HomeShortcutDto {
  key: "FOOD" | "COFFEE" | "MILK_TEA";
  label: string;
}

export interface RecommendationsDto {
  category: StoreCategory;
  stores: StoreSummaryDto[];
  dishes: DishSummaryDto[];
}

export interface SearchDto {
  query: string;
  stores: StoreSummaryDto[];
  dishes: DishSummaryDto[];
}

import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { storeClosedReason } from "../../common/catalog/store-availability.js";
import { foldVietnamese } from "../../common/text/vietnamese-fold.js";
import type {
  MerchantStoreDto,
  MerchantStoreOverviewDto,
  SetupStepDto,
  StoreProfileInput,
  StoreUpdateInput
} from "../../dto/merchant/storefront.dto.js";
import type {
  OpeningHours,
  Store
} from "../../entities/catalog/store.entity.js";
import type { AuthenticatedUser } from "../../guards/role.guard.js";
import {
  StorefrontRepository,
  type CatalogCounts,
  type StorePatch
} from "../../repositories/merchant/storefront.repository.js";
import { MediaService } from "../media/media.service.js";

export function storeSlug(name: string): string {
  const base = foldVietnamese(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "cua-hang"}-${randomBytes(3).toString("hex")}`;
}

export function toMerchantStore(
  store: Store,
  now = new Date()
): MerchantStoreDto {
  const closedReason = storeClosedReason(store, now);
  return {
    id: store.id,
    name: store.name,
    category: store.category,
    description: store.description,
    addressLine: store.addressLine,
    phone: store.phone,
    logoImageUrl: store.logoImageUrl,
    coverImageUrl: store.coverImageUrl,
    isPublished: store.isActive,
    isAcceptingOrders: store.isAcceptingOrders,
    openingHours: store.openingHours,
    isOpenNow: closedReason === null,
    closedReason
  };
}

export function canPublish(store: Store, counts: CatalogCounts): boolean {
  return Boolean(store.phone && store.addressLine) && counts.orderableCount > 0;
}

export function setupSteps(
  store: Store | null,
  counts: CatalogCounts
): SetupStepDto[] {
  return [
    {
      key: "PROFILE",
      label: "Thông tin cửa hàng",
      done: Boolean(store),
      required: true
    },
    {
      key: "IMAGES",
      label: "Logo và ảnh bìa",
      done: Boolean(store?.logoImageUrl && store.coverImageUrl),
      required: false
    },
    {
      key: "MENU",
      label: "Ít nhất một món đang bán",
      done: counts.orderableCount > 0,
      required: true
    },
    {
      key: "PUBLISH",
      label: "Hiển thị cửa hàng cho khách",
      done: Boolean(store?.isActive),
      required: true
    }
  ];
}

const EMPTY_COUNTS: CatalogCounts = {
  categoryCount: 0,
  productCount: 0,
  availableCount: 0,
  orderableCount: 0
};

@Injectable()
export class StorefrontService {
  constructor(
    private readonly storefront: StorefrontRepository,
    private readonly media: MediaService
  ) {}

  async overview(userId: string): Promise<MerchantStoreOverviewDto> {
    const store = await this.storefront.findStoreByOwner(userId);
    const counts = store
      ? await this.storefront.counts(store.id)
      : EMPTY_COUNTS;
    return {
      store: store ? toMerchantStore(store) : null,
      setup: setupSteps(store, counts),
      catalog: {
        categoryCount: counts.categoryCount,
        productCount: counts.productCount,
        availableCount: counts.availableCount,
        unavailableCount: counts.productCount - counts.availableCount
      },
      canPublish: store ? canPublish(store, counts) : false
    };
  }

  async create(
    user: AuthenticatedUser,
    input: StoreProfileInput
  ): Promise<MerchantStoreOverviewDto> {
    if (await this.storefront.findStoreByOwner(user.id))
      throw new ConflictException("Tài khoản này đã có cửa hàng.");
    let created: Store | null = null;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      created = await this.storefront.createStore({
        ...input,
        ownerUserId: user.id,
        slug: storeSlug(input.name)
      });
      if (!created && (await this.storefront.findStoreByOwner(user.id)))
        throw new ConflictException("Tài khoản này đã có cửa hàng.");
    }
    if (!created)
      throw new ConflictException("Chưa tạo được cửa hàng, hãy thử lại.");
    return this.overview(user.id);
  }

  async update(
    userId: string,
    input: StoreUpdateInput
  ): Promise<MerchantStoreOverviewDto> {
    const store = await this.ownStore(userId);
    const { logoMediaId, coverMediaId, ...profile } = input;
    const patch: StorePatch = { ...profile };
    if (logoMediaId !== undefined)
      patch.logoImageUrl =
        logoMediaId === null
          ? null
          : await this.media.ownedUrl(store.id, logoMediaId);
    if (coverMediaId !== undefined)
      patch.coverImageUrl =
        coverMediaId === null
          ? null
          : await this.media.ownedUrl(store.id, coverMediaId);
    await this.storefront.updateStore(store.id, patch);
    return this.overview(userId);
  }

  async setAcceptingOrders(userId: string, accepting: boolean) {
    const store = await this.ownStore(userId);
    await this.storefront.updateStore(store.id, {
      isAcceptingOrders: accepting
    });
    return this.overview(userId);
  }

  async setOpeningHours(userId: string, hours: OpeningHours | null) {
    const store = await this.ownStore(userId);
    await this.storefront.updateStore(store.id, { openingHours: hours });
    return this.overview(userId);
  }

  /** Publishing needs a reachable store with something customers can order. */
  async setPublished(userId: string, published: boolean) {
    const store = await this.ownStore(userId);
    if (published && !canPublish(store, await this.storefront.counts(store.id)))
      throw new BadRequestException(
        "Cần số điện thoại, địa chỉ và ít nhất một món đang bán trước khi hiển thị cửa hàng."
      );
    await this.storefront.updateStore(store.id, { isActive: published });
    return this.overview(userId);
  }

  async ownStore(userId: string): Promise<Store> {
    const store = await this.storefront.findStoreByOwner(userId);
    if (!store) throw new NotFoundException("Tài khoản này chưa có cửa hàng.");
    return store;
  }
}

import { canonicalizeVietnamesePhone } from "../common/auth/phone-number.js";
import { StoreCategory } from "../entities/catalog/store.entity.js";

/** Development catalog assets are served by the API only outside production. */
export const DEVELOPMENT_MEDIA_PREFIX = "/media/dev";

export interface OptionGroupFixture {
  name: string;
  minSelect: number;
  maxSelect: number;
  options: { name: string; priceDeltaVnd: number }[];
}

export interface ProductFixture {
  name: string;
  description: string;
  priceVnd: number;
  image: string;
  isAvailable?: boolean;
  options?: OptionGroupFixture[];
}

export interface StoreFixture {
  slug: string;
  ownerPhone: string;
  name: string;
  category: StoreCategory;
  description: string;
  addressLine: string;
  cover: string;
  categories: { name: string; products: ProductFixture[] }[];
}

const coffeeSize: OptionGroupFixture = {
  name: "Kích cỡ",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { name: "Vừa", priceDeltaVnd: 0 },
    { name: "Lớn", priceDeltaVnd: 6000 }
  ]
};
const sugar: OptionGroupFixture = {
  name: "Mức đường",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { name: "Bình thường", priceDeltaVnd: 0 },
    { name: "Ít đường", priceDeltaVnd: 0 },
    { name: "Không đường", priceDeltaVnd: 0 }
  ]
};
const teaSize: OptionGroupFixture = {
  name: "Kích cỡ",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { name: "M", priceDeltaVnd: 0 },
    { name: "L", priceDeltaVnd: 8000 }
  ]
};
const teaSugar: OptionGroupFixture = {
  name: "Mức đường",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { name: "100%", priceDeltaVnd: 0 },
    { name: "70%", priceDeltaVnd: 0 },
    { name: "50%", priceDeltaVnd: 0 },
    { name: "30%", priceDeltaVnd: 0 }
  ]
};
const toppings: OptionGroupFixture = {
  name: "Topping",
  minSelect: 0,
  maxSelect: 3,
  options: [
    { name: "Trân châu đen", priceDeltaVnd: 6000 },
    { name: "Trân châu trắng", priceDeltaVnd: 8000 },
    { name: "Pudding trứng", priceDeltaVnd: 8000 },
    { name: "Kem cheese", priceDeltaVnd: 10000 }
  ]
};
const extras = (...options: [string, number][]): OptionGroupFixture => ({
  name: "Thêm",
  minSelect: 0,
  maxSelect: options.length,
  options: options.map(([name, priceDeltaVnd]) => ({ name, priceDeltaVnd }))
});
const comTamExtras = extras(
  ["Trứng ốp la", 8000],
  ["Chả trứng", 10000],
  ["Sườn thêm", 25000]
);
const noodleExtras = extras(
  ["Trứng chần", 6000],
  ["Quẩy", 5000],
  ["Thêm bánh", 8000]
);
const coffee = [coffeeSize, sugar];
const tea = [teaSize, teaSugar, toppings];

/** Merchant accounts that own the seeded stores; the first is the F01 merchant fixture. */
export const DEVELOPMENT_STORE_FIXTURES: StoreFixture[] = [
  {
    slug: "com-tam-sai-gon",
    ownerPhone: "0860000002",
    name: "Cơm Tấm Sài Gòn",
    category: StoreCategory.FOOD,
    description:
      "Cơm tấm sườn nướng than hoa, nước mắm pha theo công thức nhà.",
    addressLine: "84 Đinh Tiên Hoàng, P. Đa Kao, Q.1",
    cover: "com-tam",
    categories: [
      {
        name: "Cơm tấm",
        products: [
          {
            name: "Cơm tấm sườn bì chả",
            description: "Sườn nướng, bì, chả trứng, mỡ hành và đồ chua.",
            priceVnd: 55000,
            image: "com-tam",
            options: [comTamExtras]
          },
          {
            name: "Cơm tấm sườn nướng",
            description: "Sườn cốt lết nướng than, ăn kèm dưa leo, cà chua.",
            priceVnd: 45000,
            image: "com-tam",
            options: [comTamExtras]
          },
          {
            name: "Cơm gà xối mỡ",
            description: "Đùi gà chiên giòn da, cơm chiên nước gà.",
            priceVnd: 50000,
            image: "com-ga",
            options: [extras(["Trứng ốp la", 8000])]
          }
        ]
      },
      {
        name: "Món thêm",
        products: [
          {
            name: "Canh khổ qua nhồi thịt",
            description: "Canh thanh mát, nấu mỗi sáng.",
            priceVnd: 20000,
            image: "canh"
          },
          {
            name: "Chả trứng hấp",
            description: "Một phần chả trứng hấp nóng.",
            priceVnd: 12000,
            image: "cha-trung"
          }
        ]
      },
      {
        name: "Đồ uống",
        products: [
          {
            name: "Trà đá",
            description: "Ly lớn.",
            priceVnd: 5000,
            image: "tra-da"
          },
          {
            name: "Nước sâm",
            description: "Sâm bí đao nấu tại quán.",
            priceVnd: 15000,
            image: "nuoc-sam",
            isAvailable: false
          }
        ]
      }
    ]
  },
  {
    slug: "bun-bo-hue-1989",
    ownerPhone: "0860000101",
    name: "Bún Bò Huế 1989",
    category: StoreCategory.FOOD,
    description: "Nước dùng hầm xương 12 tiếng, sả và mắm ruốc Huế.",
    addressLine: "21 Trần Quang Khải, P. Tân Định, Q.1",
    cover: "bun-bo",
    categories: [
      {
        name: "Bún bò",
        products: [
          {
            name: "Bún bò đặc biệt",
            description: "Bắp bò, chả cua, giò heo và huyết.",
            priceVnd: 65000,
            image: "bun-bo",
            options: [noodleExtras]
          },
          {
            name: "Bún bò tái nạm",
            description: "Thịt bò tái mềm và nạm giòn.",
            priceVnd: 55000,
            image: "bun-bo",
            options: [noodleExtras]
          },
          {
            name: "Bún bò chả cua",
            description: "Chả cua viên tay, rau sống ăn kèm.",
            priceVnd: 50000,
            image: "bun-bo",
            options: [noodleExtras]
          }
        ]
      },
      {
        name: "Ăn kèm",
        products: [
          {
            name: "Chả giò tôm thịt",
            description: "4 cuốn, kèm nước mắm chua ngọt.",
            priceVnd: 35000,
            image: "cha-gio"
          }
        ]
      }
    ]
  },
  {
    slug: "pho-ha-thanh",
    ownerPhone: "0860000102",
    name: "Phở Hà Thành",
    category: StoreCategory.FOOD,
    description: "Phở bò kiểu Bắc, nước trong, ngọt thanh vị quế hồi.",
    addressLine: "158 Pasteur, P. Bến Nghé, Q.1",
    cover: "pho",
    categories: [
      {
        name: "Phở bò",
        products: [
          {
            name: "Phở tái chín",
            description: "Thịt bò tái và chín, hành lá, rau thơm.",
            priceVnd: 60000,
            image: "pho",
            options: [noodleExtras]
          },
          {
            name: "Phở bò viên",
            description: "Bò viên dai, nước dùng xương ống.",
            priceVnd: 55000,
            image: "pho",
            options: [noodleExtras]
          },
          {
            name: "Phở đặc biệt",
            description: "Tái, chín, gầu, gân và bò viên.",
            priceVnd: 75000,
            image: "pho",
            options: [noodleExtras]
          }
        ]
      },
      {
        name: "Món cuốn",
        products: [
          {
            name: "Gỏi cuốn tôm thịt",
            description: "2 cuốn, kèm tương đậu phộng.",
            priceVnd: 30000,
            image: "goi-cuon"
          }
        ]
      }
    ]
  },
  {
    slug: "banh-mi-co-ba",
    ownerPhone: "0860000103",
    name: "Bánh Mì Cô Ba",
    category: StoreCategory.FOOD,
    description: "Bánh mì nướng giòn, pate gan nhà làm và bún thịt nướng.",
    addressLine: "37 Nguyễn Huệ, P. Bến Nghé, Q.1",
    cover: "banh-mi",
    categories: [
      {
        name: "Bánh mì",
        products: [
          {
            name: "Bánh mì thịt nướng",
            description: "Thịt nướng sả, đồ chua, ngò và ớt.",
            priceVnd: 30000,
            image: "banh-mi",
            options: [extras(["Pate", 5000], ["Trứng ốp la", 6000])]
          },
          {
            name: "Bánh mì đặc biệt",
            description: "Chả lụa, thịt nguội, pate và bơ.",
            priceVnd: 35000,
            image: "banh-mi",
            options: [extras(["Pate", 5000], ["Trứng ốp la", 6000])]
          }
        ]
      },
      {
        name: "Bún",
        products: [
          {
            name: "Bún thịt nướng chả giò",
            description: "Bún tươi, thịt nướng, chả giò và mỡ hành.",
            priceVnd: 45000,
            image: "bun-thit-nuong"
          }
        ]
      }
    ]
  },
  {
    slug: "ca-phe-muoi-chu-long",
    ownerPhone: "0860000104",
    name: "Cà Phê Muối Chú Long",
    category: StoreCategory.COFFEE,
    description: "Cà phê muối Huế với lớp kem mặn béo.",
    addressLine: "12 Lê Thánh Tôn, P. Bến Nghé, Q.1",
    cover: "ca-phe-muoi",
    categories: [
      {
        name: "Cà phê",
        products: [
          {
            name: "Cà phê muối",
            description: "Cà phê phin, kem muối đánh bông.",
            priceVnd: 35000,
            image: "ca-phe-muoi",
            options: coffee
          },
          {
            name: "Cà phê sữa đá",
            description: "Robusta đậm, sữa đặc.",
            priceVnd: 29000,
            image: "ca-phe-sua",
            options: coffee
          },
          {
            name: "Bạc xỉu",
            description: "Nhiều sữa, ít cà phê.",
            priceVnd: 32000,
            image: "bac-xiu",
            options: coffee
          }
        ]
      },
      {
        name: "Bánh ngọt",
        products: [
          {
            name: "Bánh flan",
            description: "Flan trứng, caramel đắng nhẹ.",
            priceVnd: 18000,
            image: "flan"
          }
        ]
      }
    ]
  },
  {
    slug: "the-phin-corner",
    ownerPhone: "0860000105",
    name: "The Phin Corner",
    category: StoreCategory.COFFEE,
    description: "Phin truyền thống và cà phê pha máy từ hạt Cầu Đất.",
    addressLine: "5 Hồ Tùng Mậu, P. Nguyễn Thái Bình, Q.1",
    cover: "latte",
    categories: [
      {
        name: "Phin",
        products: [
          {
            name: "Cà phê đen đá",
            description: "Robusta Buôn Ma Thuột pha phin.",
            priceVnd: 25000,
            image: "ca-phe-den",
            options: coffee
          },
          {
            name: "Cà phê sữa nóng",
            description: "Pha phin, sữa đặc, uống nóng.",
            priceVnd: 29000,
            image: "ca-phe-sua",
            options: coffee
          }
        ]
      },
      {
        name: "Pha máy",
        products: [
          {
            name: "Latte",
            description: "Espresso Arabica và sữa tươi đánh nóng.",
            priceVnd: 45000,
            image: "latte",
            options: coffee
          },
          {
            name: "Cold brew cam sả",
            description: "Ủ lạnh 16 giờ, cam vàng và sả.",
            priceVnd: 49000,
            image: "cold-brew",
            options: [coffeeSize]
          }
        ]
      }
    ]
  },
  {
    slug: "ca-phe-sua-da-1975",
    ownerPhone: "0860000106",
    name: "Cà Phê Sữa Đá 1975",
    category: StoreCategory.COFFEE,
    description: "Cà phê vợt Sài Gòn xưa và trà đào cam sả.",
    addressLine: "92 Võ Văn Tần, P.6, Q.3",
    cover: "ca-phe-sua",
    categories: [
      {
        name: "Cà phê",
        products: [
          {
            name: "Cà phê vợt sữa đá",
            description: "Pha vợt, sữa đặc Ông Thọ.",
            priceVnd: 27000,
            image: "ca-phe-sua",
            options: coffee
          },
          {
            name: "Cà phê dừa",
            description: "Cốt dừa xay đá, cà phê đậm.",
            priceVnd: 39000,
            image: "ca-phe-dua",
            options: [coffeeSize]
          }
        ]
      },
      {
        name: "Trà",
        products: [
          {
            name: "Trà đào cam sả",
            description: "Đào miếng, cam vàng, sả tươi.",
            priceVnd: 39000,
            image: "tra-dao",
            options: [coffeeSize, sugar]
          }
        ]
      }
    ]
  },
  {
    slug: "tra-sua-may",
    ownerPhone: "0860000107",
    name: "Trà Sữa Mây",
    category: StoreCategory.MILK_TEA,
    description: "Trà sữa ủ lạnh, trân châu nấu mới mỗi 2 giờ.",
    addressLine: "210 Nguyễn Thị Minh Khai, P.6, Q.3",
    cover: "tra-sua",
    categories: [
      {
        name: "Trà sữa",
        products: [
          {
            name: "Trà sữa trân châu đường đen",
            description: "Sữa tươi, đường đen Okinawa, trân châu dẻo.",
            priceVnd: 45000,
            image: "tra-sua",
            options: tea
          },
          {
            name: "Trà sữa ô long",
            description: "Ô long rang, vị trà đậm hậu ngọt.",
            priceVnd: 39000,
            image: "tra-sua",
            options: tea
          },
          {
            name: "Matcha latte",
            description: "Matcha Uji và sữa tươi.",
            priceVnd: 49000,
            image: "matcha",
            options: tea
          }
        ]
      },
      {
        name: "Trà trái cây",
        products: [
          {
            name: "Trà vải hoa hồng",
            description: "Vải thiều, trà xanh nhài, hương hồng.",
            priceVnd: 42000,
            image: "tra-trai-cay",
            options: [teaSize, teaSugar]
          }
        ]
      }
    ]
  },
  {
    slug: "tiem-tra-lai",
    ownerPhone: "0860000108",
    name: "Tiệm Trà Lài",
    category: StoreCategory.MILK_TEA,
    description: "Trà nhài Thái Nguyên, sữa tươi thanh trùng.",
    addressLine: "45 Cao Thắng, P.3, Q.3",
    cover: "tra-trai-cay",
    categories: [
      {
        name: "Trà sữa",
        products: [
          {
            name: "Trà sữa lài",
            description: "Trà lài ướp hoa tươi, ít béo.",
            priceVnd: 35000,
            image: "tra-sua",
            options: tea
          },
          {
            name: "Hồng trà sữa",
            description: "Hồng trà Assam và sữa tươi.",
            priceVnd: 35000,
            image: "tra-sua",
            options: tea
          }
        ]
      },
      {
        name: "Trà trái cây",
        products: [
          {
            name: "Trà lài đác thơm",
            description: "Hạt đác rim thơm, trà lài lạnh.",
            priceVnd: 39000,
            image: "tra-trai-cay",
            options: [teaSize, teaSugar]
          }
        ]
      }
    ]
  },
  {
    slug: "tran-chau-duong-den-88",
    ownerPhone: "0860000109",
    name: "Trân Châu Đường Đen 88",
    category: StoreCategory.MILK_TEA,
    description: "Sữa tươi trân châu đường đen, kem cheese mặn.",
    addressLine: "88 Nguyễn Trãi, P. Bến Thành, Q.1",
    cover: "matcha",
    categories: [
      {
        name: "Sữa tươi",
        products: [
          {
            name: "Sữa tươi trân châu đường đen",
            description: "Sữa tươi Đà Lạt, trân châu hổ.",
            priceVnd: 42000,
            image: "tra-sua",
            options: tea
          },
          {
            name: "Matcha kem cheese",
            description: "Matcha đậm, lớp kem cheese mặn.",
            priceVnd: 52000,
            image: "matcha",
            options: tea
          }
        ]
      }
    ]
  }
];

export interface DevelopmentCatalogWriter {
  ensureMerchant(phone: string): Promise<string>;
  upsertStore(
    fixture: StoreFixture,
    ownerUserId: string,
    coverImageUrl: string
  ): Promise<string>;
  upsertCategory(
    storeId: string,
    name: string,
    position: number
  ): Promise<string>;
  upsertProduct(
    storeId: string,
    categoryId: string,
    fixture: ProductFixture,
    imageUrl: string,
    position: number
  ): Promise<string>;
  upsertOptionGroup(
    productId: string,
    fixture: OptionGroupFixture,
    position: number
  ): Promise<string>;
  upsertOption(
    groupId: string,
    name: string,
    priceDeltaVnd: number,
    position: number
  ): Promise<void>;
}

export function developmentImageUrl(name: string): string {
  return `${DEVELOPMENT_MEDIA_PREFIX}/${name}.png`;
}

/** Idempotent: every write is an upsert keyed by a natural unique key. */
export async function seedDevelopmentCatalog(
  writer: DevelopmentCatalogWriter
): Promise<void> {
  for (const store of DEVELOPMENT_STORE_FIXTURES) {
    const ownerId = await writer.ensureMerchant(
      canonicalizeVietnamesePhone(store.ownerPhone)
    );
    const storeId = await writer.upsertStore(
      store,
      ownerId,
      developmentImageUrl(`cover-${store.cover}`)
    );
    for (const [categoryIndex, category] of store.categories.entries()) {
      const categoryId = await writer.upsertCategory(
        storeId,
        category.name,
        categoryIndex
      );
      for (const [productIndex, product] of category.products.entries()) {
        const productId = await writer.upsertProduct(
          storeId,
          categoryId,
          product,
          developmentImageUrl(product.image),
          productIndex
        );
        for (const [groupIndex, group] of (product.options ?? []).entries()) {
          const groupId = await writer.upsertOptionGroup(
            productId,
            group,
            groupIndex
          );
          for (const [optionIndex, option] of group.options.entries())
            await writer.upsertOption(
              groupId,
              option.name,
              option.priceDeltaVnd,
              optionIndex
            );
        }
      }
    }
  }
}

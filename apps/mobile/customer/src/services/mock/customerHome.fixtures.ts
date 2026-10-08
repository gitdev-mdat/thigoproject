import type {
  CustomerHomeResponse,
  DishSummary,
  RecentOrdersResponse,
  StoreSummary
} from "../../types/home";

/**
 * Demo data for the Customer home while the catalog API (F02 storefront and
 * catalog) is not built. Only the mock source reads this file.
 */
export const homeFixture: CustomerHomeResponse = {
  greetingName: null,
  address: {
    id: "addr-demo-1",
    label: "Nhà",
    line: "12 Nguyễn Trãi, Q.1, TP. Hồ Chí Minh"
  },
  shortcuts: [
    {
      id: "food",
      kind: "category",
      category: "food",
      label: "Đồ ăn",
      art: "🍜"
    },
    {
      id: "coffee",
      kind: "category",
      category: "coffee",
      label: "Cà phê",
      art: "☕"
    },
    {
      id: "milk_tea",
      kind: "category",
      category: "milk_tea",
      label: "Trà sữa",
      art: "🧋"
    },
    { id: "recent", kind: "recent_orders", label: "Đơn gần đây", art: "🧾" }
  ],
  promotions: [
    {
      id: "promo-first-order",
      eyebrow: "Ưu đãi dành cho bạn",
      title: "Miễn phí giao hàng cho đơn đầu tiên",
      description: "Áp dụng cho đơn từ 50.000 ₫.",
      code: "THIGOFOOD"
    }
  ]
};

export const storeFixtures: StoreSummary[] = [
  {
    id: "st-com-tam",
    name: "Cơm Tấm Sài Gòn",
    category: "food",
    tags: ["Cơm tấm", "Món Việt"],
    rating: 4.8,
    ratingCount: 1240,
    etaMinutes: { min: 20, max: 30 },
    art: "🍛"
  },
  {
    id: "st-bun-bo",
    name: "Bún Bò Huế 1989",
    category: "food",
    tags: ["Bún bò", "Món Việt"],
    rating: 4.7,
    ratingCount: 672,
    etaMinutes: { min: 25, max: 35 },
    art: "🍜"
  },
  {
    id: "st-pho",
    name: "Phở Hà Thành",
    category: "food",
    tags: ["Phở", "Món Bắc"],
    rating: 4.6,
    ratingCount: 918,
    etaMinutes: { min: 20, max: 30 },
    art: "🍲"
  },
  {
    id: "st-banh-mi",
    name: "Bánh Mì Cô Ba",
    category: "food",
    tags: ["Bánh mì", "Ăn sáng"],
    rating: 4.5,
    ratingCount: 431,
    etaMinutes: { min: 15, max: 25 },
    art: "🥖"
  },
  {
    id: "st-ca-phe-muoi",
    name: "Cà Phê Muối Chú Long",
    category: "coffee",
    tags: ["Cà phê muối", "Đồ uống"],
    rating: 4.8,
    ratingCount: 2015,
    etaMinutes: { min: 15, max: 25 },
    art: "☕"
  },
  {
    id: "st-phin",
    name: "The Phin Corner",
    category: "coffee",
    tags: ["Cà phê phin", "Bạc xỉu"],
    rating: 4.6,
    ratingCount: 540,
    etaMinutes: { min: 20, max: 30 },
    art: "🥤"
  },
  {
    id: "st-1975",
    name: "Cà Phê Sữa Đá 1975",
    category: "coffee",
    tags: ["Cà phê sữa", "Món Việt"],
    rating: 4.5,
    ratingCount: 389,
    etaMinutes: { min: 15, max: 20 },
    art: "🧊"
  },
  {
    id: "st-may",
    name: "Trà Sữa Mây",
    category: "milk_tea",
    tags: ["Trà sữa", "Trân châu"],
    rating: 4.6,
    ratingCount: 856,
    etaMinutes: { min: 15, max: 25 },
    art: "🧋"
  },
  {
    id: "st-tra-lai",
    name: "Tiệm Trà Lài",
    category: "milk_tea",
    tags: ["Trà trái cây", "Trà lài"],
    rating: 4.7,
    ratingCount: 603,
    etaMinutes: { min: 20, max: 30 },
    art: "🍵"
  },
  {
    id: "st-duong-den",
    name: "Trân Châu Đường Đen 88",
    category: "milk_tea",
    tags: ["Sữa tươi", "Đường đen"],
    rating: 4.4,
    ratingCount: 297,
    etaMinutes: { min: 20, max: 30 },
    art: "🥛"
  }
];

export const dishFixtures: DishSummary[] = [
  {
    id: "d-suon-bi-cha",
    name: "Cơm tấm sườn bì chả",
    storeName: "Cơm Tấm Sài Gòn",
    category: "food",
    price: 55000,
    art: "🍛"
  },
  {
    id: "d-bun-bo-dac-biet",
    name: "Bún bò đặc biệt",
    storeName: "Bún Bò Huế 1989",
    category: "food",
    price: 65000,
    art: "🍜"
  },
  {
    id: "d-pho-tai-nam",
    name: "Phở tái nạm",
    storeName: "Phở Hà Thành",
    category: "food",
    price: 60000,
    art: "🍲"
  },
  {
    id: "d-ca-phe-muoi",
    name: "Cà phê muối",
    storeName: "Cà Phê Muối Chú Long",
    category: "coffee",
    price: 32000,
    art: "☕"
  },
  {
    id: "d-bac-xiu",
    name: "Bạc xỉu đá",
    storeName: "The Phin Corner",
    category: "coffee",
    price: 35000,
    art: "🥤"
  },
  {
    id: "d-ca-phe-sua",
    name: "Cà phê sữa đá",
    storeName: "Cà Phê Sữa Đá 1975",
    category: "coffee",
    price: 29000,
    art: "🧊"
  },
  {
    id: "d-tra-sua-tran-chau",
    name: "Trà sữa trân châu",
    storeName: "Trà Sữa Mây",
    category: "milk_tea",
    price: 42000,
    art: "🧋"
  },
  {
    id: "d-tra-lai-vai",
    name: "Trà lài vải",
    storeName: "Tiệm Trà Lài",
    category: "milk_tea",
    price: 45000,
    art: "🍵"
  },
  {
    id: "d-sua-tuoi-duong-den",
    name: "Sữa tươi trân châu đường đen",
    storeName: "Trân Châu Đường Đen 88",
    category: "milk_tea",
    price: 39000,
    art: "🥛"
  }
];

export const recentOrdersFixture: RecentOrdersResponse = {
  orders: [
    {
      id: "ord-demo-2",
      storeName: "Trà Sữa Mây",
      itemsSummary: "2 × Trà sữa trân châu",
      total: 84000,
      status: "delivered",
      placedAt: "2026-10-07T12:40:00+07:00",
      art: "🧋"
    },
    {
      id: "ord-demo-1",
      storeName: "Cơm Tấm Sài Gòn",
      itemsSummary: "1 × Cơm tấm sườn bì chả, 1 × Trà đá",
      total: 60000,
      status: "delivered",
      placedAt: "2026-10-05T19:05:00+07:00",
      art: "🍛"
    }
  ]
};

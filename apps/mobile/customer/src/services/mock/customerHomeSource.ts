import type { CustomerHomeSource } from "../customerHome";
import {
  dishFixtures,
  homeFixture,
  recentOrdersFixture,
  storeFixtures
} from "./customerHome.fixtures";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** Lowercases and strips Vietnamese diacritics so "tra sua" matches "Trà sữa". */
export const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Answers the Customer home endpoints from local fixtures with network-like latency. */
export function createMockCustomerHomeSource(
  latencyMs = 350
): CustomerHomeSource {
  return {
    getHome: async () => {
      await wait(latencyMs);
      return clone(homeFixture);
    },
    getRecommendations: async (category) => {
      await wait(latencyMs);
      return {
        category,
        stores: storeFixtures.filter((store) => store.category === category),
        dishes: dishFixtures.filter((dish) => dish.category === category)
      };
    },
    getRecentOrders: async () => {
      await wait(latencyMs);
      return clone(recentOrdersFixture);
    },
    search: async (query) => {
      await wait(latencyMs);
      const needle = normalizeSearch(query);
      const matches = (...fields: string[]) =>
        fields.some((field) => normalizeSearch(field).includes(needle));
      return {
        query,
        stores: storeFixtures.filter((store) =>
          matches(store.name, ...store.tags)
        ),
        dishes: dishFixtures.filter((dish) =>
          matches(dish.name, dish.storeName)
        )
      };
    }
  };
}

import { useCallback, useEffect, useState } from "react";

import { ordersApi, type AddressInput } from "../services/orders";
import type { Address } from "../types/orders";

export function useAddresses() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [addresses, setAddresses] = useState<Address[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setAddresses((await ordersApi.addresses()).addresses);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(
    async (input: AddressInput) => {
      const address = await ordersApi.createAddress(input);
      await load();
      return address;
    },
    [load]
  );

  return { status, addresses, reload: load, create };
}

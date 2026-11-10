import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode
} from "react";
import {
  cartCount,
  cartReducer,
  cartSubtotal,
  emptyCart,
  type Cart,
  type CartAction
} from "../utils/cart";

type CartContext = {
  cart: Cart;
  count: number;
  subtotal: number;
  dispatch: (action: CartAction) => void;
};

const Context = createContext<CartContext | null>(null);

/** Keeps the cart in memory for the signed-in session, across screens. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, emptyCart);
  const value = useMemo(
    () => ({
      cart,
      count: cartCount(cart),
      subtotal: cartSubtotal(cart),
      dispatch
    }),
    [cart]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCart(): CartContext {
  const value = useContext(Context);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

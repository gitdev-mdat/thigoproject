# Proposal: merchant-managed product options

Status: proposal, not built. F02 says "Avoid excessive product attributes/options" and "No topping engine", so merchants cannot edit options yet.

## What exists today

- Tables `product_option_groups` (name, `min_select`, `max_select`, position) and `product_options` (name, `price_delta_vnd`, `is_available`, position) were added with the ordering slice.
- Only development seeds create them. Checkout already validates them server-side: min/max per group, options must belong to the product, unavailable options are refused, and the chosen names and prices are copied into `order_items.options` as a snapshot.
- The merchant menu shows a read-only "N tuỳ chọn" count for products that have options.

## Smallest useful extension

1. API, owner-scoped like the rest of `merchant/catalog`:
   - `POST merchant/catalog/products/:id/option-groups` with `{ name, minSelect, maxSelect }`
   - `PATCH|DELETE merchant/catalog/option-groups/:id`
   - `POST merchant/catalog/option-groups/:id/options` with `{ name, priceDeltaVnd }`
   - `PATCH|DELETE merchant/catalog/options/:id` (name, price delta, availability)
2. Rules: at most 5 groups per product and 10 options per group; `0 ≤ minSelect ≤ maxSelect ≤ option count`; integer price deltas from 0 to 200.000 ₫; names unique within their parent.
3. Deleting an option that past orders used only marks it unavailable, because orders keep their own snapshot. Nothing else in ordering changes.
4. UI: a "Tuỳ chọn" section in the product form with a group list, each group holding a list of options with price deltas, and a required/optional toggle that sets `minSelect`.

No schema change is needed beyond optional `archived_at` columns if soft deletion is preferred over availability flags. This needs the owner's approval before it is scheduled.

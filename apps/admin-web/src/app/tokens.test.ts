import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { colors, radius, spacing } from "@thigo/design-tokens";
import { describe, expect, it } from "vitest";

// The admin web styles itself only through @thigo/design-tokens/css, so that
// file must mirror every semantic token in the package.
const css = readFileSync(
  createRequire(import.meta.url).resolve("@thigo/design-tokens/css"),
  "utf8"
);
const kebab = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

describe("design token CSS", () => {
  it("mirrors every color token", () => {
    for (const [group, values] of Object.entries(colors))
      for (const [name, hex] of Object.entries(values))
        expect(css).toContain(
          `--thigo-${kebab(group)}-${kebab(name)}: ${hex.toLowerCase()};`
        );
  });

  it("mirrors the spacing and radius scales", () => {
    for (const [name, px] of Object.entries(spacing))
      if (px) expect(css).toContain(`--thigo-space-${name}: ${px / 16}rem;`);
    for (const [name, px] of Object.entries(radius))
      if (name !== "full")
        expect(css).toContain(`--thigo-radius-${name}: ${px / 16}rem;`);
  });
});

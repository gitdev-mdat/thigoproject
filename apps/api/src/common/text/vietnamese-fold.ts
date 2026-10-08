const LOWER =
  "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";

function base(character: string): string {
  return character === "đ"
    ? "d"
    : character.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Characters folded by {@link foldVietnamese}, usable with SQL `translate()`. */
export const VIETNAMESE_FOLD_FROM = LOWER + LOWER.toUpperCase();
export const VIETNAMESE_FOLD_TO = [...VIETNAMESE_FOLD_FROM]
  .map((character) => base(character.toLowerCase()))
  .join("");

/** Lowercases and strips Vietnamese diacritics so "tra sua" matches "Trà sữa". */
export function foldVietnamese(value: string): string {
  return [...value]
    .map((character) => {
      const index = VIETNAMESE_FOLD_FROM.indexOf(character);
      return index >= 0 ? VIETNAMESE_FOLD_TO[index] : character;
    })
    .join("")
    .toLowerCase();
}

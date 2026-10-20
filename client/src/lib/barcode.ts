/** Validate retail GTIN check digits; accept camera/manual UPC-E by expanding it. */
function validGtin(code: string) {
  let sum = 0;
  for (
    let i = code.length - 2, weight = 3;
    i >= 0;
    i--, weight = weight === 3 ? 1 : 3
  )
    sum += Number(code[i]) * weight;
  return (10 - (sum % 10)) % 10 === Number(code.at(-1));
}
export function expandUPCE(code: string) {
  if (!/^[01]\d{7}$/.test(code)) return null;
  const [n, a, b, c, d, e, f, check] = code;
  const body =
    Number(f) <= 2
      ? `${n}${a}${b}${f}0000${c}${d}${e}`
      : f === "3"
        ? `${n}${a}${b}${c}00000${d}${e}`
        : f === "4"
          ? `${n}${a}${b}${c}${d}00000${e}`
          : `${n}${a}${b}${c}${d}${e}0000${f}`;
  const expanded = body + check;
  return validGtin(expanded) ? expanded : null;
}
export function normalizeBarcode(value: string, upce = false) {
  const code = value.trim().replace(/[\s-]/g, "");
  if (!/^\d+$/.test(code) || ![8, 12, 13].includes(code.length))
    throw new Error("Enter a valid UPC-A, UPC-E, EAN-13 or EAN-8 barcode.");
  if (code.length === 8) {
    const expanded = expandUPCE(code);
    if (upce && expanded) return expanded;
    if (validGtin(code)) return code;
    if (expanded) return expanded;
  } else if (validGtin(code)) return code;
  throw new Error(
    "The barcode check digit is invalid. Check the printed number and retry.",
  );
}
export function barcodeIdentity(value: string) {
  const code = normalizeBarcode(value);
  return code.length === 12 ? `0${code}` : code;
}

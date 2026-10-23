import type { Page } from "@playwright/test";
export async function textContrast(page: Page) {
  return page.evaluate(() => {
    type Color = number[];
    const parse = (value: string): Color => {
      const n = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
      return [n[0], n[1], n[2], n[3] ?? 1];
    };
    const blend = (f: Color, b: Color): Color =>
      [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
    const background = (el: Element | null): Color =>
      el
        ? blend(
            parse(getComputedStyle(el).backgroundColor),
            background(el.parentElement),
          )
        : [248, 250, 252, 1];
    const luminance = (c: Color) =>
      c
        .slice(0, 3)
        .map((x) => x / 255)
        .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
        .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    const scope =
      document.querySelector('[role="dialog"],[role="alertdialog"]') ??
      document.querySelector(".app-shell") ??
      document.body;
    const readings: { text: string; ratio: number; required: number }[] = [];
    for (const el of [scope, ...scope.querySelectorAll("*")]) {
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join("")
        .trim();
      const css = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (
        !text ||
        !rect.width ||
        !rect.height ||
        rect.bottom < 0 ||
        rect.top > innerHeight ||
        el.closest(':disabled,[aria-hidden="true"],.sr-only') ||
        css.visibility === "hidden" ||
        css.display === "none"
      )
        continue;
      const bg = background(el),
        fg = blend(parse(css.color), bg);
      const l = [luminance(fg), luminance(bg)].sort((a, b) => a - b);
      const ratio = (l[1] + 0.05) / (l[0] + 0.05);
      const size = parseFloat(css.fontSize);
      const required =
        size >= 24 || (size >= 18.66 && Number(css.fontWeight) >= 700)
          ? 3
          : 4.5;
      readings.push({
        text: text.slice(0, 80),
        ratio: Number(ratio.toFixed(2)),
        required,
      });
    }
    return { readings, failures: readings.filter((x) => x.ratio < x.required) };
  });
}

/** Read-only journal projections. Never normalize or persist source records. */
export interface JournalItem {
  id: string;
  text: string | null;
  date: Date | null;
  timestamp: Date | null;
  title: string;
  preview: string;
}
export function journalDate(value: string): Date | null {
  const match =
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value) ??
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const iso = value.includes("-");
  const [y, m, d] = iso
    ? [+match[1], +match[2], +match[3]]
    : [+match[3], +match[1], +match[2]];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? date
    : null;
}
export function journalItems(records: Record<string, unknown>): JournalItem[] {
  return Object.entries(records)
    .map(([id, value]) => {
      const obj =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : null;
      const text =
        typeof value === "string"
          ? value
          : typeof obj?.text === "string"
            ? obj.text
            : null;
      const saved =
        typeof obj?.timestamp === "string" ? new Date(obj.timestamp) : null;
      const lines =
        text
          ?.split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
      return {
        id,
        text,
        date: journalDate(id),
        timestamp: saved && Number.isFinite(saved.getTime()) ? saved : null,
        title:
          lines[0] || (text === null ? "Unreadable entry" : "Untitled entry"),
        preview: lines.slice(1).join(" "),
      };
    })
    .sort(
      (a, b) =>
        (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity) ||
        (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0) ||
        a.id.localeCompare(b.id),
    );
}
export function groupJournal(items: JournalItem[], now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const groups = new Map<string, JournalItem[]>();
  for (const item of items) {
    const d = item.date;
    const label = !d
      ? "Undated"
      : d >= start && d < end
        ? "Previous 30 Days"
        : d.getFullYear() === now.getFullYear()
          ? d.toLocaleDateString("en-US", { month: "long" })
          : String(d.getFullYear());
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups].map(([label, entries]) => ({ label, entries }));
}
export function searchJournal(items: JournalItem[], input: string) {
  const q = input.trim().toLowerCase().replace(/,/g, "").replace(/\s+/g, " ");
  if (!q) return items;
  let dateMatch: ((d: Date) => boolean) | null = null;
  const full = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(q);
  const exact =
    journalDate(q) ??
    (full
      ? journalDate(
          `${+full[3] < 100 ? 2000 + +full[3] : full[3]}-${full[1]}-${full[2]}`,
        )
      : null);
  const month = /^([a-z]+) (\d{1,4})(?: (\d{4}))?$/.exec(q);
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  if (exact) dateMatch = (d) => d.getTime() === exact.getTime();
  else if (/^\d{4}$/.test(q)) dateMatch = (d) => d.getFullYear() === +q;
  else if (month) {
    const m = months.findIndex(
      (v) => v === month[1] || v.slice(0, 3) === month[1],
    );
    if (m >= 0)
      dateMatch = month[3]
        ? (d) =>
            d.getMonth() === m &&
            d.getDate() === +month[2] &&
            d.getFullYear() === +month[3]
        : +month[2] > 31
          ? (d) => d.getMonth() === m && d.getFullYear() === +month[2]
          : (d) => d.getMonth() === m && d.getDate() === +month[2];
  }
  return items.filter((item) =>
    dateMatch
      ? !!item.date && dateMatch(item.date)
      : q
          .split(" ")
          .every((term) => (item.text ?? "").toLowerCase().includes(term)),
  );
}

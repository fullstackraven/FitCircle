import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Search,
  SquarePen,
  X,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { getTodayString } from "@/lib/date-utils";
import {
  groupJournal,
  journalItems,
  searchJournal,
  type JournalItem,
} from "@/lib/journal-library";

export function JournalLog() {
  const [, navigate] = useLocation();
  const { getAllJournalEntries } = useWorkouts({ skipInitialWrite: true });
  const search = useSearch();
  const query = new URLSearchParams(search).get("q") ?? "";
  const setQuery = (value: string) => {
    navigate(`/journal-log${value ? `?q=${encodeURIComponent(value)}` : ""}`, {
      replace: true,
      state: history.state,
    });
  };
  const [now, setNow] = useState(() => new Date());
  const items = journalItems(getAllJournalEntries());
  const results = searchJournal(items, query);
  useEffect(() => {
    const top = history.state?.journalScrollTop;
    const frame = requestAnimationFrame(() => {
      if (typeof top === "number")
        document.querySelector("main")?.scrollTo(0, top);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const open = (item: { id: string }, edit = false) => {
    history.replaceState(
      {
        ...history.state,
        journalScrollTop: document.querySelector("main")?.scrollTop ?? 0,
      },
      "",
      window.location.href,
    );
    const params = new URLSearchParams({ date: item.id });
    if (edit) params.set("edit", "1");
    if (query) params.set("q", query);
    navigate(`/journal-entry?${params}`, {
      state: { journalFromLibrary: true },
    });
  };
  const create = () => open({ id: getTodayString() }, true);
  const dateLabel = (item: JournalItem) =>
    item.date?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) ?? `Undated · ${item.id}`;
  return (
    <div className="journal-library max-w-3xl mx-auto text-strong">
      <button
        aria-label="Back to Logs"
        data-testid="button-back"
        className="h-11 w-11 flex items-center justify-center rounded-full bg-surface text-supporting"
        onClick={() => navigate("/wellness")}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-3xl font-bold mt-4">Journal</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6" aria-live="polite">
        {query.trim()
          ? `${results.length} ${results.length === 1 ? "result" : "results"}`
          : `${items.length} ${items.length === 1 ? "entry" : "entries"}`}
      </p>
      {groupJournal(results, now).map((group) => (
        <section key={group.label} className="mb-7">
          <h2 className="text-lg font-bold mb-2">{group.label}</h2>
          <div className="rounded-2xl bg-surface overflow-hidden divide-y divide-border">
            {group.entries.map((item) => (
              <button
                key={item.id}
                className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                onClick={() => open(item)}
              >
                <span className="min-w-0 flex-1">
                  <span className="font-semibold block truncate">
                    {item.title}
                  </span>
                  <span className="text-sm text-muted-foreground block truncate mt-1">
                    {dateLabel(item)}
                    {item.preview && `  ${item.preview}`}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 text-muted-foreground"
                />
              </button>
            ))}
          </div>
        </section>
      ))}
      {!results.length && (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="w-9 h-9 mx-auto mb-3" />
          <h2 className="font-semibold">
            {query.trim() ? "No matching entries" : "No Journal Entries Yet"}
          </h2>
          <p className="text-sm mt-2">
            {query.trim()
              ? "Try another word or date."
              : "Tap compose to write your daily reflection."}
          </p>
        </div>
      )}
      <div
        className="journal-toolbar"
        role="search"
        aria-label="Search journal"
      >
        <div className="relative flex items-center gap-2 rounded-full bg-surface border border-control px-4 flex-1 min-w-0 shadow-sm">
          <Search
            aria-hidden="true"
            className="w-4 h-4 shrink-0 text-muted-foreground"
          />
          <input
            type="search"
            aria-label="Search journal"
            id="journal-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-w-0 h-12 bg-transparent border-0 text-strong placeholder:text-muted-foreground outline-none"
          />
          {!query && (
            <label
              htmlFor="journal-search"
              className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              Search journal…
            </label>
          )}
          {query && (
            <button
              aria-label="Clear search"
              className="h-10 w-8 shrink-0"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          aria-label="Write new journal entry"
          title="Write new journal entry"
          onClick={create}
          className="rounded-full h-12 w-12 shrink-0 bg-action text-on-action flex items-center justify-center shadow-sm"
        >
          <SquarePen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Search,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useJournalReaderHistory } from "@/hooks/use-journal-reader-history";
import { getTodayString } from "@/lib/date-utils";
import {
  groupJournal,
  journalItems,
  searchJournal,
  type JournalItem,
} from "@/lib/journal-library";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function JournalLog() {
  const [, navigate] = useLocation();
  const { getAllJournalEntries, addJournalEntry, deleteJournalEntry } =
    useWorkouts({ skipInitialWrite: true });
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<JournalItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [writeError, setWriteError] = useState("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const items = journalItems(getAllJournalEntries());
  const results = searchJournal(items, query);
  const dirty = !!selected && text !== (selected.text ?? "");
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
  useEffect(() => {
    if (editing) editor.current?.focus();
  }, [editing, selected?.id]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => {
    if (!dirty || confirm("Discard unsaved journal changes?")) {
      setSelected(null);
      setEditing(false);
      return true;
    }
    return false;
  };
  useJournalReaderHistory(!!selected, close);
  const open = (item: JournalItem, edit = false) => {
    setWriteError("");
    setSelected(item);
    setText(item.text ?? "");
    setEditing(edit && item.text !== null);
  };
  const create = () =>
    open(
      items.find((i) => i.id === getTodayString()) ?? {
        id: getTodayString(),
        text: "",
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        timestamp: null,
        title: "New entry",
        preview: "",
      },
      true,
    );
  const save = () => {
    if (!selected || !text.trim()) return;
    if (!addJournalEntry(selected.id, text)) {
      setWriteError(
        "Could not save this entry. Your draft is still open. Free device storage and try again.",
      );
      return;
    }
    setWriteError("");
    setSelected({
      ...selected,
      text,
      title: text.split(/\r?\n/).find((s) => s.trim()) ?? "Untitled entry",
      timestamp: new Date(),
    });
    setEditing(false);
  };
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
      <Dialog
        open={!!selected}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent
          className="journal-reader max-w-2xl bg-surface text-strong"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Daily Journal</DialogTitle>
            <DialogDescription className="sr-only">
              Read or edit your daily reflection. Changes are saved only with
              Save Entry.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <div className="journal-reader-actions flex items-center gap-2 pr-7">
                <button
                  aria-label="Back to journal library"
                  className="h-11 w-11 flex items-center justify-center text-supporting"
                  onClick={close}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="flex-1" />
                {selected.text !== null && !editing && (
                  <button
                    className="h-11 px-3 text-accent-text font-semibold"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </button>
                )}
                {editing && (
                  <button
                    data-testid="button-save-journal"
                    disabled={!text.trim()}
                    className="h-11 px-3 font-semibold text-accent-text disabled:opacity-50"
                    onClick={save}
                  >
                    Save Entry
                  </button>
                )}
                {items.some((i) => i.id === selected.id) && (
                  <button
                    aria-label="Delete journal entry"
                    data-testid="button-delete-journal"
                    className="h-11 w-11 flex items-center justify-center text-danger-text"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete this journal entry? This action cannot be undone.",
                        )
                      ) {
                        if (deleteJournalEntry(selected.id)) setSelected(null);
                        else
                          setWriteError(
                            "Could not delete this entry. The original record is unchanged.",
                          );
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {dateLabel(selected)}
                {selected.timestamp &&
                  ` · ${selected.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
              </p>
              {writeError && (
                <p role="alert" className="text-danger-text text-sm">
                  {writeError}
                </p>
              )}
              {selected.text === null ? (
                <p role="alert">
                  This entry cannot be read safely. Its original record has been
                  preserved. Download a complete backup from Account Data before
                  attempting recovery.
                </p>
              ) : editing ? (
                <textarea
                  ref={editor}
                  aria-label="Journal entry"
                  data-testid="textarea-journal-entry"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="journal-writing-area w-full bg-transparent text-strong border-0 resize-none focus:outline-none focus:ring-0"
                  autoCapitalize="sentences"
                  spellCheck
                />
              ) : (
                <div
                  className="journal-writing-area whitespace-pre-wrap break-words leading-relaxed"
                  data-testid="journal-reader-text"
                >
                  {selected.text || "This entry is empty."}
                </div>
              )}
              {editing && (
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="text-word-count"
                >
                  {text.trim() ? text.trim().split(/\s+/).length : 0} words
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

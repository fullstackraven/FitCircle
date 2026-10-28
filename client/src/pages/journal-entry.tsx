import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, SquarePen, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { getTodayString } from "@/lib/date-utils";
import { journalDate, journalItems } from "@/lib/journal-library";

export function JournalEntryPage() {
  const [, navigate] = useLocation();
  const { getAllJournalEntries, addJournalEntry, deleteJournalEntry } =
    useWorkouts({ skipInitialWrite: true });
  const params = new URLSearchParams(window.location.search);
  const id = params.get("date") ?? getTodayString();
  const source = journalItems(getAllJournalEntries()).find(
    (item) => item.id === id,
  );
  const [editing, setEditing] = useState(params.get("edit") === "1" || !source);
  const [text, setText] = useState(source?.text ?? "");
  const [savedText, setSavedText] = useState(source?.text ?? "");
  const [error, setError] = useState("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const allowedToLeave = useRef(false);
  const draftFence = useRef<string | null>(null);
  const dirty = text !== savedText;
  const returnURL = `/journal-log${params.get("q") ? `?q=${encodeURIComponent(params.get("q")!)}` : ""}`;
  const fromLibrary = useRef(history.state?.journalFromLibrary === true);
  useEffect(() => {
    if (editing) editor.current?.focus({ preventScroll: true });
  }, [editing]);
  const returnToLibrary = () => {
    if (fromLibrary.current) history.back();
    else navigate(returnURL, { replace: true });
  };
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty && !allowedToLeave.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    // Stay on this route while asking about Back. Intercepting a route-changing
    // popstate is too late: the router can already have unmounted the draft.
    const marker = `journal-draft-${Date.now()}-${Math.random()}`;
    const pushFence = () => {
      history.pushState(
        { ...history.state, journalDraftFence: marker },
        "",
        window.location.href,
      );
      draftFence.current = marker;
    };
    pushFence();
    const back = () => {
      if (allowedToLeave.current || history.state?.journalDraftFence === marker)
        return;
      if (!confirm("Discard unsaved journal changes?")) {
        pushFence();
        return;
      }
      allowedToLeave.current = true;
      draftFence.current = null;
      returnToLibrary();
    };
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("popstate", back);
      draftFence.current = null;
      // Save removes the transient fence; explicit navigation already consumes it.
      if (
        !allowedToLeave.current &&
        history.state?.journalDraftFence === marker
      )
        history.back();
    };
  }, [dirty]);
  const leave = (discardConfirmed = false) => {
    if (
      !discardConfirmed &&
      dirty &&
      !confirm("Discard unsaved journal changes?")
    )
      return;
    allowedToLeave.current = true;
    if (draftFence.current) {
      // Consume the same-route draft fence before returning to the prior page.
      window.addEventListener("popstate", returnToLibrary, { once: true });
      history.back();
    } else returnToLibrary();
  };
  const save = () => {
    if (!text.trim()) return;
    if (!addJournalEntry(id, text)) {
      setError(
        "Could not save this entry. Your draft is still open. Free device storage and try again.",
      );
      return;
    }
    setSavedText(text);
    setError("");
    setEditing(false);
  };
  const date = journalDate(id);
  return (
    <section
      className="journal-entry-page max-w-3xl mx-auto text-strong"
      aria-label="Daily Journal"
    >
      <div className="journal-entry-actions flex items-center gap-2">
        <button
          aria-label="Back to journal library"
          onClick={() => leave()}
          className="fc-pill fc-icon-button h-11 w-11 flex items-center justify-center text-supporting"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="sr-only">Daily Journal</h1>
        <span className="flex-1" />
        {source?.text !== null &&
          (editing ? (
            <button
              aria-label="Save Entry"
              title="Save Entry"
              data-testid="button-save-journal"
              disabled={!text.trim()}
              onClick={save}
              className="fc-pill fc-icon-button h-11 w-11 flex items-center justify-center bg-action text-on-action disabled:opacity-50"
            >
              <Check aria-hidden="true" className="h-6 w-6" />
            </button>
          ) : (
            <button
              aria-label="Edit"
              title="Edit"
              onClick={() => setEditing(true)}
              className="fc-pill fc-icon-button h-11 w-11 flex items-center justify-center text-accent-text"
            >
              <SquarePen aria-hidden="true" className="h-5 w-5" />
            </button>
          ))}
        {source && (
          <button
            aria-label="Delete journal entry"
            data-testid="button-delete-journal"
            className="fc-pill fc-icon-button h-11 w-11 flex items-center justify-center text-danger-text"
            onClick={() => {
              if (
                !confirm(
                  "Are you sure you want to delete this journal entry? This action cannot be undone.",
                )
              )
                return;
              if (deleteJournalEntry(id)) leave(true);
              else
                setError(
                  "Could not delete this entry. The original record is unchanged.",
                );
            }}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center my-5 break-words">
        {date
          ? date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : `Undated · ${id}`}
        {source?.timestamp &&
          ` · ${source.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
      </p>
      {error && (
        <p role="alert" className="text-danger-text text-sm mb-4">
          {error}
        </p>
      )}
      {source?.text === null ? (
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
          onChange={(event) => setText(event.target.value)}
          className="journal-plain-editor journal-page-editor w-full bg-transparent text-strong border-0 resize-none focus:outline-none focus:ring-0"
          autoCapitalize="sentences"
          spellCheck
        />
      ) : (
        <div
          data-testid="journal-reader-text"
          className="whitespace-pre-wrap break-words text-[17px] leading-relaxed"
        >
          {savedText || "This entry is empty."}
        </div>
      )}
      {editing && (
        <p
          className="text-xs text-muted-foreground mt-3"
          data-testid="text-word-count"
        >
          {text.trim() ? text.trim().split(/\s+/).length : 0} words
        </p>
      )}
    </section>
  );
}

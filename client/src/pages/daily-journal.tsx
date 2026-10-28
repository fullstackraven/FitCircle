import { PageHeader } from '@/components/ui/presentation';
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, Calendar, FileText, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useJournalReaderHistory } from "@/hooks/use-journal-reader-history";
import { format } from "date-fns";

export function DailyJournal() {
  const [, navigate] = useLocation();
  const { getJournalEntry, getJournalEntryWithTimestamp, addJournalEntry } =
    useWorkouts({ skipInitialWrite: true });
  const [journalText, setJournalText] = useState("");
  const originalText = useRef("");
  const editor = useRef<HTMLTextAreaElement>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [writeError, setWriteError] = useState("");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Check if we came from wellness page
  const urlParams = new URLSearchParams(window.location.search);
  const fromWellness = urlParams.get("from") === "wellness";

  const handleBack = () => {
    if (
      journalText !== originalText.current &&
      !confirm("Discard unsaved journal changes?")
    )
      return false;
    if (fromWellness) {
      navigate("/wellness");
    } else {
      navigate("/calendar");
    }
    return true;
  };
  useJournalReaderHistory(journalText !== originalText.current, handleBack);

  useEffect(() => {
    const guardDock = (event: MouseEvent) => {
      if (
        journalText !== originalText.current &&
        event.target instanceof Element &&
        event.target.closest(".app-dock") &&
        !confirm("Discard unsaved journal changes?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", guardDock, true);
    return () => document.removeEventListener("click", guardDock, true);
  }, [journalText]);

  useEffect(() => {
    // Check for date parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");

    let dateStr: string;
    let displayDate: Date;

    if (dateParam) {
      dateStr = dateParam;
      displayDate = new Date(dateParam + "T00:00:00");
    } else {
      // Load today's journal entry
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
      displayDate = today;
    }

    setCurrentDate(dateStr);
    const entry = getJournalEntry(dateStr);
    setJournalText(entry || "");
    originalText.current = entry || "";
    editor.current?.focus();

    // Get timestamp for existing entry
    const entryWithTimestamp = getJournalEntryWithTimestamp(dateStr);
    setLastSaved(entryWithTimestamp?.timestamp || null);
  }, [window.location.search]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (journalText !== originalText.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [journalText]);

  const handleJournalSubmit = () => {
    if (journalText.trim()) {
      if (!addJournalEntry(currentDate, journalText)) {
        setWriteError(
          "Could not save this entry. Your draft is still open. Free device storage and try again.",
        );
        return;
      }
      setWriteError("");
      originalText.current = journalText;
      setLastSaved(new Date().toISOString());

      // Show success confirmation instead of native alert
      setShowSaveConfirmation(true);
      setTimeout(() => {
        setShowSaveConfirmation(false);
      }, 2000);
    }
  };

  const getDisplayDate = () => {
    if (!currentDate) return format(new Date(), "MMMM d, yyyy");
    const date = new Date(currentDate + "T00:00:00");
    return Number.isFinite(date.getTime())
      ? format(date, "MMMM d, yyyy")
      : "Undated entry";
  };

  const getWordCount = () => {
    if (!journalText.trim()) return 0;
    return journalText.trim().split(/\s+/).length;
  };

  return (
    <div
      className="flex flex-col max-w-3xl mx-auto"
      style={{ backgroundColor: "var(--page-background)" }}
    >
      {/* Header */}
      <PageHeader title="Daily Journal" onBack={handleBack} className="mb-4" actions={<button
        onClick={() => {
          if (journalText === originalText.current || confirm("Discard unsaved journal changes?"))
            navigate(`/journal-log${fromWellness ? "?from=wellness" : ""}`);
        }} className="fc-icon-action" title="View all journal entries" aria-label="View all journal entries"><FileText size={20}/></button>} />

      {/* Date indicator */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{getDisplayDate()}</p>
          <p className="text-xs text-dim" data-testid="text-word-count">
            {getWordCount()} {getWordCount() === 1 ? "word" : "words"}
          </p>
        </div>
        {lastSaved && Number.isFinite(new Date(lastSaved).getTime()) && (
          <p className="text-xs text-dim mt-1">
            Last saved: {format(new Date(lastSaved), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </div>

      {/* Main writing area - flexbox layout */}
      <div className="flex-1 px-4 pb-6 flex flex-col">
        <textarea
          ref={editor}
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          aria-label="Journal entry"
          className="journal-plain-editor flex-1 w-full p-0 bg-transparent text-strong border-none resize-none focus:outline-none text-base leading-relaxed placeholder-dim"
          style={{
            lineHeight: "1.6",
            touchAction: "manipulation",
            minHeight: "200px", // Minimum height instead of vh-based
          }}
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck={true}
          data-testid="textarea-journal-entry"
        />
      </div>

      {writeError && (
        <p role="alert" className="px-4 text-danger-text">
          {writeError}
        </p>
      )}
      {/* Save confirmation toast */}
      {showSaveConfirmation && (
        <div
          className="sticky top-0 z-50 flex justify-center"
          style={{
            animation: "fadeInOut 2s ease-in-out",
          }}
        >
          <div className="bg-action text-on-action px-4 py-3 rounded-xl flex items-center space-x-2 shadow-lg">
            <Check className="w-5 h-5" />
            <span>Journal entry saved successfully!</span>
          </div>
        </div>
      )}

      {/* Floating save button - positioned above nav bar */}
      <div
        className="sticky px-4 pb-4 z-40"
        style={{ bottom: "max(var(--dock-height), var(--safe-bottom))" }}
      >
        <button
          onClick={handleJournalSubmit}
          aria-label="Save Entry"
          title="Save Entry"
          className="ml-auto flex h-11 w-11 items-center justify-center bg-action hover:bg-action-hover text-on-action rounded-full transition-colors"
          data-testid="button-save-journal"
        >
          <Check className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

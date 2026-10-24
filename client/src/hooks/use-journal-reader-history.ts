import { useEffect, useRef } from "react";

/** One transient history entry makes browser Back dismiss the reader first.
 * No route, journal record, or persisted preference is changed. */
export function useJournalReaderHistory(
  open: boolean,
  requestClose: () => boolean,
) {
  const close = useRef(requestClose);
  close.current = requestClose;
  useEffect(() => {
    if (!open) return;
    const marker = `journal-${Date.now()}-${Math.random()}`;
    const url = window.location.href;
    const push = () =>
      history.pushState(
        { ...history.state, fitcircleJournalReader: marker },
        "",
        url,
      );
    push();
    const back = () => {
      if (history.state?.fitcircleJournalReader === marker) return;
      if (!close.current()) push();
    };
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("popstate", back);
      if (history.state?.fitcircleJournalReader === marker) history.back();
    };
  }, [open]);
}

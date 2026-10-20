import { useEffect, useState } from "react";
import { readRecommendation } from "@/lib/fitness-recommendation";
import { INTEGRATION_CHANGED } from "@/lib/measurement-integration";
export function useFitnessIntegration() {
  const [state, setState] = useState(() => readRecommendation());
  useEffect(() => {
    const refresh = () => setState(readRecommendation());
    refresh();
    for (const event of [
      "storage",
      "focus",
      "fitcircleProfileChanged",
      INTEGRATION_CHANGED,
    ])
      window.addEventListener(event, refresh);
    return () => {
      for (const event of [
        "storage",
        "focus",
        "fitcircleProfileChanged",
        INTEGRATION_CHANGED,
      ])
        window.removeEventListener(event, refresh);
    };
  }, []);
  return state;
}

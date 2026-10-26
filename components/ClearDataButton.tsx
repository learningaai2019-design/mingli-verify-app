"use client";
import { PRIVACY_COPY } from "@/lib/shared/privacy";

export default function ClearDataButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => {
        onClear();
        // Explicitly do NOT write PII anywhere; only clear React state via parent.
        try {
          // Theme preference only — never birth data
        } catch { /* ignore */ }
      }}
    >
      {PRIVACY_COPY.clear}
    </button>
  );
}

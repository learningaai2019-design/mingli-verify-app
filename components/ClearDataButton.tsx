"use client";
import { PRIVACY_COPY } from "@/lib/shared/privacy";
import { clearModuleResult, type ModuleId } from "@/lib/shared/compare-store";
import { clearBaziChartSession, clearZiweiChartSession } from "@/lib/shared/session-chart";

export default function ClearDataButton({
  onClear,
  moduleId,
}: {
  onClear: () => void;
  moduleId?: ModuleId;
}) {
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={() => {
        onClear();
        if (moduleId) clearModuleResult(moduleId);
        if (moduleId === "bazi") clearBaziChartSession();
        if (moduleId === "ziwei") clearZiweiChartSession();
      }}
    >
      {PRIVACY_COPY.clear}
    </button>
  );
}

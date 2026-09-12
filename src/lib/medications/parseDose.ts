// The dose is captured as one free-text field in the UI (e.g. "75mg",
// "1.5 ml") but the Supabase schema splits it into a numeric `dose` and a
// text `dose_unit` — split it here rather than at every call site.
export function parseDose(doseText: string): { dose: number | null; doseUnit: string | null } {
  const trimmed = doseText.trim();
  const match = trimmed.match(/^([\d.]+)\s*(.*)$/);
  if (!match) {
    return { dose: null, doseUnit: trimmed || null };
  }
  const [, numberPart, unitPart] = match;
  const dose = parseFloat(numberPart);
  return {
    dose: Number.isFinite(dose) ? dose : null,
    doseUnit: unitPart.trim() || null,
  };
}

// Inverse of parseDose, for displaying a real Supabase row (numeric
// dose + text dose_unit) back as the single free-text field the rest of
// the UI expects (add-medication.tsx, review.tsx, reminder.tsx headers).
export function formatDose(dose: number | null, doseUnit: string | null): string {
  return [dose !== null ? String(dose) : null, doseUnit].filter(Boolean).join('') || '';
}

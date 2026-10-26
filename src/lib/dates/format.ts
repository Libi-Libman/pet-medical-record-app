// Formats a Date as a local 'YYYY-MM-DD' string -- i.e. the calendar date
// the person actually picked/sees on their device clock.
//
// Never use `date.toISOString().split('T')[0]` for this. toISOString()
// converts to UTC first, which silently shifts the date backward by one
// day for anyone in a timezone ahead of UTC (e.g. Germany, UTC+1/+2) --
// local midnight on Oct 24 becomes Oct 23 22:00/23:00 UTC, so the date
// string comes out as "2026-10-23". This was a real, reproduced bug
// (confirmed via live QA Oct 24, 2026): editing or adding a dated entry
// without touching the date at all shifted it back a day on save.
export const toDateInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const todayInput = (): string => toDateInput(new Date());

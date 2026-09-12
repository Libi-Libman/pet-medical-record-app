// Maps the app's human-facing frequency choice to the real Supabase schema
// (supabase table `medications`: frequency_type/frequency_interval are a
// checked enum, reminder_times is a real time[] column) and to a default
// set of reminder times for that frequency — morning/noon/evening, editable
// by the owner rather than fixed. See MyTherapy-style intake screens this
// was modeled after.

export type FrequencyType =
  | 'once_daily'
  | 'multiple_daily'
  | 'every_x_hours'
  | 'every_x_days'
  | 'weekly'
  | 'monthly'
  | 'as_needed'
  | 'custom';

export type FrequencyPlan = {
  frequencyType: FrequencyType;
  frequencyInterval: number | null;
  defaultTimes: string[]; // 'HH:MM', 24h
  intakeLabels: string[];
  requiresReminder: boolean;
};

// Presets shown in the add-medication picker. Every-x-hours/days, weekly and
// monthly exist in the schema but aren't exposed in the UI yet — that's a
// deliberate scope cut, not an oversight; add a preset here when they are.
export const FREQUENCY_PRESETS = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'] as const;

const PLANS: Record<string, FrequencyPlan> = {
  'Once daily': {
    frequencyType: 'once_daily',
    frequencyInterval: null,
    defaultTimes: ['08:00'],
    intakeLabels: ['Morning dose'],
    requiresReminder: true,
  },
  'Twice daily': {
    frequencyType: 'multiple_daily',
    frequencyInterval: 2,
    defaultTimes: ['08:00', '20:00'],
    intakeLabels: ['Morning dose', 'Evening dose'],
    requiresReminder: true,
  },
  'Three times daily': {
    frequencyType: 'multiple_daily',
    frequencyInterval: 3,
    defaultTimes: ['08:00', '13:00', '20:00'],
    intakeLabels: ['Morning dose', 'Midday dose', 'Evening dose'],
    requiresReminder: true,
  },
  'As needed': {
    frequencyType: 'as_needed',
    frequencyInterval: null,
    defaultTimes: [],
    intakeLabels: [],
    requiresReminder: false,
  },
};

const FALLBACK_PLAN = PLANS['Once daily'];

// The review screen's frequency field is free text pulled from a (simulated)
// document extraction, e.g. "Twice daily, with food" — not one of the exact
// preset labels above. Match on keywords so that still resolves sensibly
// instead of silently falling back to "once daily".
export function getFrequencyPlan(frequencyLabel: string): FrequencyPlan {
  if (PLANS[frequencyLabel]) return PLANS[frequencyLabel];

  const lower = frequencyLabel.toLowerCase();
  if (lower.includes('as needed') || lower.includes('as-needed') || lower.includes('prn')) {
    return PLANS['As needed'];
  }
  if (lower.includes('three') || lower.includes('3x') || lower.includes('3 times')) {
    return PLANS['Three times daily'];
  }
  if (lower.includes('twice') || lower.includes('2x') || lower.includes('2 times')) {
    return PLANS['Twice daily'];
  }
  if (lower.includes('once') || lower.includes('1x') || lower.includes('daily')) {
    return PLANS['Once daily'];
  }
  return FALLBACK_PLAN;
}

// Inverse of the preset → plan mapping, for displaying a real Supabase row
// (which only has frequency_type/frequency_interval) back as the same kind
// of human label the UI shows everywhere else.
export function describeFrequency(type: FrequencyType, interval: number | null): string {
  switch (type) {
    case 'once_daily':
      return 'Once daily';
    case 'multiple_daily':
      if (interval === 2) return 'Twice daily';
      if (interval === 3) return 'Three times daily';
      return interval ? `${interval}x daily` : 'Multiple times daily';
    case 'every_x_hours':
      return interval ? `Every ${interval} hours` : 'Every few hours';
    case 'every_x_days':
      return interval ? `Every ${interval} days` : 'Every few days';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'as_needed':
      return 'As needed';
    case 'custom':
    default:
      return 'Custom';
  }
}

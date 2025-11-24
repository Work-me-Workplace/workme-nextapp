export const EVENT_AUDIENCE_OPTIONS = [
  { value: "ALL_WORKFORCE", label: "All Workforce" },
  { value: "LEADERS", label: "Leaders" },
  { value: "WORKFORCE_AND_FAMILIES", label: "Workforce + Families" },
  { value: "COMMUNITY", label: "Community" },
] as const;

export type EventAudienceValue = typeof EVENT_AUDIENCE_OPTIONS[number]['value'];


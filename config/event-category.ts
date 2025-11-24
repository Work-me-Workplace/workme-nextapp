export const EVENT_CATEGORY_OPTIONS = [
  { value: "CELEBRATION", label: "Celebration" },
  { value: "HERITAGE", label: "Heritage" },
  { value: "COMMUNITY", label: "Community" },
  { value: "RECOGNITION", label: "Recognition" },
  { value: "APPRECIATION", label: "Appreciation" },
  { value: "FAMILY", label: "Family" },
] as const;

export type EventCategoryValue = typeof EVENT_CATEGORY_OPTIONS[number]['value'];


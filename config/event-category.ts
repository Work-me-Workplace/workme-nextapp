export const EVENT_CATEGORY_OPTIONS = [
  { value: "CELEBRATION", label: "Celebration" },
  { value: "HERITAGE", label: "Heritage" },
  { value: "COMMUNITY", label: "Community" },
  { value: "RECOGNITION", label: "Recognition" },
  { value: "APPRECIATION", label: "Appreciation" },
  { value: "FAMILY", label: "Family" },
  { value: "TRAINING", label: "Training" },
  { value: "SOCIAL", label: "Social" },
  { value: "NETWORKING", label: "Networking" },
  { value: "WELLNESS", label: "Wellness" },
] as const;

export type EventCategoryValue = typeof EVENT_CATEGORY_OPTIONS[number]['value'];


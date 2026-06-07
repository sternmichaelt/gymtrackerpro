export const MUSCLE_GROUPS = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "legs", label: "Legs" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "core", label: "Core" },
  { value: "full_body", label: "Full Body" },
] as const;

export const EQUIPMENT_TYPES = [
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "cable", label: "Cable" },
  { value: "machine", label: "Machine" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "other", label: "Other" },
] as const;

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: "home" },
  { href: "/workouts", label: "Workouts", icon: "dumbbell" },
  { href: "/templates", label: "Templates", icon: "layout" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

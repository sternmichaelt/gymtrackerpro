export const COLOR_THEME_STORAGE_KEY = "gymtrack-color-theme";

export type ColorThemeId =
  | "classic"
  | "ocean-blue"
  | "steel-grey"
  | "midnight-navy"
  | "forest-green"
  | "emerald"
  | "ruby-red"
  | "rose-pink"
  | "lavender"
  | "teal";

export interface ColorTheme {
  id: ColorThemeId;
  label: string;
  swatch: string;
}

export const DEFAULT_COLOR_THEME: ColorThemeId = "classic";

export const COLOR_THEMES: ColorTheme[] = [
  { id: "classic", label: "Classic", swatch: "#525252" },
  { id: "ocean-blue", label: "Ocean Blue", swatch: "#2563eb" },
  { id: "steel-grey", label: "Steel Grey", swatch: "#64748b" },
  { id: "midnight-navy", label: "Midnight", swatch: "#1e3a8a" },
  { id: "forest-green", label: "Forest", swatch: "#166534" },
  { id: "emerald", label: "Emerald", swatch: "#059669" },
  { id: "ruby-red", label: "Ruby", swatch: "#dc2626" },
  { id: "rose-pink", label: "Rose", swatch: "#ec4899" },
  { id: "lavender", label: "Lavender", swatch: "#a855f7" },
  { id: "teal", label: "Teal", swatch: "#0d9488" },
];

export function isColorThemeId(value: string): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}

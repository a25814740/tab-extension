export type ThemeTokenSet = {
  // Accepts plain color, gradient, or background-image expression (e.g. url(...)).
  background: string;
  panel: string;
  leftPanelBackground?: string;
  mainPanelBackground?: string;
  rightPanelBackground?: string;
  panelMuted: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
};

export type ThemePreset = {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  isOfficial: boolean;
  priceTwd: number;
  preview: string;
  tokens: {
    light: ThemeTokenSet;
    dark: ThemeTokenSet;
  };
};

export type TemplateDensity = "comfortable" | "focused" | "compact";

export type TemplatePreset = {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  isOfficial: boolean;
  priceTwd: number;
  density: TemplateDensity;
  cardMinWidth: {
    image: number;
    other: number;
  };
};

export type CustomThemeDraft = Partial<ThemeTokenSet>;

export const DEFAULT_THEME_PRESET_ID = "theme-midnight";
export const DEFAULT_TEMPLATE_PRESET_ID = "template-classic";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "theme-midnight",
    slug: "midnight",
    name: "Midnight Glass",
    description: "Low-glare dashboard with strong contrast for long working sessions.",
    author: "Taboard",
    isOfficial: true,
    priceTwd: 0,
    preview: "linear-gradient(135deg, #0f172a 0%, #111827 45%, #0b1222 100%)",
    tokens: {
      light: {
        background: "#f4f4f5",
        panel: "#ffffff",
        leftPanelBackground: "#ffffff",
        mainPanelBackground: "#ffffff",
        rightPanelBackground: "#ffffff",
        panelMuted: "#f8fafc",
        border: "#e4e4e7",
        text: "#111827",
        textMuted: "#71717a",
        accent: "#f43f5e",
      },
      dark: {
        background: "#070b14",
        panel: "#0b1222",
        leftPanelBackground: "#0b1222",
        mainPanelBackground: "#0b1222",
        rightPanelBackground: "#0b1222",
        panelMuted: "#111827",
        border: "#243041",
        text: "#f3f4f6",
        textMuted: "#9ca3af",
        accent: "#fb7185",
      },
    },
  },
  {
    id: "theme-aurora",
    slug: "aurora",
    name: "Aurora Bloom",
    description: "Colorful gradient backdrop for creative projects and mood boards.",
    author: "Taboard",
    isOfficial: true,
    priceTwd: 0,
    preview: "linear-gradient(135deg, #ecfeff 0%, #f5f3ff 40%, #ffe4e6 100%)",
    tokens: {
      light: {
        background: "linear-gradient(135deg, #ecfeff 0%, #f5f3ff 40%, #ffe4e6 100%)",
        panel: "#ffffffee",
        leftPanelBackground: "#ffffffee",
        mainPanelBackground: "#ffffffee",
        rightPanelBackground: "#ffffffee",
        panelMuted: "#f8fafcdd",
        border: "#dbeafe",
        text: "#0f172a",
        textMuted: "#475569",
        accent: "#8b5cf6",
      },
      dark: {
        background: "linear-gradient(135deg, #0b1020 0%, #191b3a 45%, #1f1124 100%)",
        panel: "#0f172add",
        leftPanelBackground: "#0f172add",
        mainPanelBackground: "#0f172add",
        rightPanelBackground: "#0f172add",
        panelMuted: "#111827cc",
        border: "#2a2f54",
        text: "#f8fafc",
        textMuted: "#cbd5e1",
        accent: "#a78bfa",
      },
    },
  },
  {
    id: "theme-sandstone",
    slug: "sandstone",
    name: "Sandstone Pro",
    description: "Warm neutral palette designed for reading-heavy workflows.",
    author: "Zeroyuan",
    isOfficial: false,
    priceTwd: 59,
    preview: "linear-gradient(140deg, #faf7f2 0%, #f3ede3 100%)",
    tokens: {
      light: {
        background: "linear-gradient(140deg, #faf7f2 0%, #f3ede3 100%)",
        panel: "#fffefb",
        leftPanelBackground: "#fffefb",
        mainPanelBackground: "#fffefb",
        rightPanelBackground: "#fffefb",
        panelMuted: "#faf7f2",
        border: "#eadfce",
        text: "#292524",
        textMuted: "#78716c",
        accent: "#ea580c",
      },
      dark: {
        background: "linear-gradient(140deg, #1a1512 0%, #120e0b 100%)",
        panel: "#1f1b18",
        leftPanelBackground: "#1f1b18",
        mainPanelBackground: "#1f1b18",
        rightPanelBackground: "#1f1b18",
        panelMuted: "#171311",
        border: "#3a3028",
        text: "#fafaf9",
        textMuted: "#d6d3d1",
        accent: "#fb923c",
      },
    },
  },
];

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "template-classic",
    slug: "classic",
    name: "Classic Board",
    description: "Balanced spacing and readability. Works for most users.",
    author: "Taboard",
    isOfficial: true,
    priceTwd: 0,
    density: "comfortable",
    cardMinWidth: {
      image: 240,
      other: 200,
    },
  },
  {
    id: "template-focus",
    slug: "focus",
    name: "Focus Flow",
    description: "Larger cards and breathing room for visual review sessions.",
    author: "Taboard",
    isOfficial: true,
    priceTwd: 0,
    density: "focused",
    cardMinWidth: {
      image: 280,
      other: 230,
    },
  },
  {
    id: "template-dense",
    slug: "dense",
    name: "Dense Ops",
    description: "More information in one screen for power users.",
    author: "Studio Public",
    isOfficial: false,
    priceTwd: 39,
    density: "compact",
    cardMinWidth: {
      image: 210,
      other: 170,
    },
  },
];

export function resolveThemePreset(themeId: string) {
  return THEME_PRESETS.find((item) => item.id === themeId) ?? THEME_PRESETS[0];
}

export function resolveTemplatePreset(templateId: string) {
  return TEMPLATE_PRESETS.find((item) => item.id === templateId) ?? TEMPLATE_PRESETS[0];
}

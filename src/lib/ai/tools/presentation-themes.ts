/**
 * Modern Presentation Themes
 * Sourced directly from:
 * 1. zarazhangrui/beautiful-html-templates (High-craft designer editorial systems)
 * 2. ai-ppt-template/free-ppt-template (Top categorized PPTX startup & corporate decks)
 */

export interface PresentationThemeConfig {
  id: string;
  name: string;
  tagline: string;
  source: "beautiful-html-templates" | "free-ppt-template";
  bg: string;
  accent: string;
  secondary: string;
  text: string;
  muted: string;
  surface: string;
  font: string;
  titleFont: string;
  scheme: "light" | "dark";
  badgeClass: string;
}

export const PRESENTATION_THEMES: Record<string, PresentationThemeConfig> = {
  // ─── 1. BEAUTIFUL HTML TEMPLATES (zarazhangrui) ──────────────────────────────
  "bento-modern": {
    id: "bento-modern",
    name: "Bento Modern",
    tagline:
      "Apple-style modular bento grid with frosted slate cards and electric iOS blue",
    source: "free-ppt-template",
    bg: "#161618",
    accent: "#0A84FF",
    secondary: "#30D158",
    text: "#F5F5F7",
    muted: "#86868B",
    surface: "#242428",
    font: "Calibri",
    titleFont: "Arial",
    scheme: "dark",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  "acid-brutalist": {
    id: "acid-brutalist",
    name: "Acid Brutalist",
    tagline:
      "High-contrast AI startup deck: pitch black carbon with acid neon lime",
    source: "free-ppt-template",
    bg: "#0D0D0D",
    accent: "#D2FF00",
    secondary: "#FFFFFF",
    text: "#FFFFFF",
    muted: "#737373",
    surface: "#1A1A1A",
    font: "Arial",
    titleFont: "Arial Black",
    scheme: "dark",
    badgeClass: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  },
  "soft-editorial": {
    id: "soft-editorial",
    name: "Soft Editorial",
    tagline:
      "Cormorant Garamond serif on warm paper with dusty pink, sage, and lemon accents",
    source: "beautiful-html-templates",
    bg: "#F2EEDF",
    accent: "#E1A4C2",
    secondary: "#D6DD63",
    text: "#2A241B",
    muted: "#5C5345",
    surface: "#ECE6D2",
    font: "Calibri",
    titleFont: "Georgia",
    scheme: "light",
    badgeClass: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  },
  "editorial-forest": {
    id: "editorial-forest",
    name: "Editorial Forest",
    tagline:
      "Forest green, dusty rose, and warm cream in Source Serif 4 quarterly review",
    source: "beautiful-html-templates",
    bg: "#1C2E24",
    accent: "#DDA7A5",
    secondary: "#8BAA90",
    text: "#F7F3E8",
    muted: "#A3B899",
    surface: "#253D30",
    font: "Georgia",
    titleFont: "Georgia",
    scheme: "dark",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  "cobalt-grid": {
    id: "cobalt-grid",
    name: "Cobalt Grid",
    tagline: "Electric cobalt on crisp graph-paper canvas with hairline rules",
    source: "beautiful-html-templates",
    bg: "#F4F6FB",
    accent: "#0020FF",
    secondary: "#4D62CD",
    text: "#0A1128",
    muted: "#586A84",
    surface: "#EAEFF9",
    font: "Calibri",
    titleFont: "Arial",
    scheme: "light",
    badgeClass: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  "black-gold": {
    id: "black-gold",
    name: "Black Gold",
    tagline:
      "Luxury executive investor storyboard in obsidian black and metallic gold",
    source: "free-ppt-template",
    bg: "#121212",
    accent: "#D4AF37",
    secondary: "#F3E5AB",
    text: "#FFFFFF",
    muted: "#8A8A8A",
    surface: "#1F1F1F",
    font: "Georgia",
    titleFont: "Georgia",
    scheme: "dark",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  "block-frame": {
    id: "block-frame",
    name: "BlockFrame",
    tagline:
      "Neobrutalist deck with pastel-neon color blocks and chunky black borders",
    source: "beautiful-html-templates",
    bg: "#FFFDF0",
    accent: "#FFE600",
    secondary: "#00F0FF",
    text: "#000000",
    muted: "#444444",
    surface: "#FFD6E8",
    font: "Arial",
    titleFont: "Arial Black",
    scheme: "light",
    badgeClass: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  "sakura-chroma": {
    id: "sakura-chroma",
    name: "Sakura Chroma",
    tagline:
      "Vintage Japanese cassette packaging: cream paper, rainbow ribbons, condensed bold type",
    source: "beautiful-html-templates",
    bg: "#F5EFE6",
    accent: "#E63946",
    secondary: "#2A9D8F",
    text: "#1D2026",
    muted: "#7A7265",
    surface: "#EADFCE",
    font: "Arial",
    titleFont: "Arial Black",
    scheme: "light",
    badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  "8-bit-orbit": {
    id: "8-bit-orbit",
    name: "8-Bit Orbit",
    tagline: "Pixel-art neon arcade aesthetic on a deep midnight void",
    source: "beautiful-html-templates",
    bg: "#0A0B1A",
    accent: "#00F0FF",
    secondary: "#FF0055",
    text: "#FFFFFF",
    muted: "#7A889B",
    surface: "#141733",
    font: "Calibri",
    titleFont: "Impact",
    scheme: "dark",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  broadside: {
    id: "broadside",
    name: "Broadside",
    tagline:
      "Dark editorial newspaper canvas with fire-orange accent and bold grotesk headlines",
    source: "beautiful-html-templates",
    bg: "#111111",
    accent: "#FF4400",
    secondary: "#FFAA00",
    text: "#EEEEEE",
    muted: "#888888",
    surface: "#1E1E1E",
    font: "Calibri",
    titleFont: "Arial Black",
    scheme: "dark",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  "emerald-editorial": {
    id: "emerald-editorial",
    name: "Emerald Editorial",
    tagline:
      "Magazine-cover business deck with imperial emerald, navy, and gold ornaments",
    source: "beautiful-html-templates",
    bg: "#FAF7F0",
    accent: "#0B3C2A",
    secondary: "#D4AF37",
    text: "#0C1821",
    muted: "#52616B",
    surface: "#F0EAE1",
    font: "Georgia",
    titleFont: "Georgia",
    scheme: "light",
    badgeClass: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  studio: {
    id: "studio",
    name: "Studio",
    tagline:
      "Black canvas with high-voltage electric-yellow type for design keynotes",
    source: "beautiful-html-templates",
    bg: "#0A0A0A",
    accent: "#E6FF00",
    secondary: "#FFFFFF",
    text: "#FFFFFF",
    muted: "#8E8E93",
    surface: "#181818",
    font: "Arial",
    titleFont: "Arial Black",
    scheme: "dark",
    badgeClass: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  },
  capsule: {
    id: "capsule",
    name: "Capsule",
    tagline:
      "Modular pill-shaped cards on warm bone with a fresh pastel-pop palette",
    source: "beautiful-html-templates",
    bg: "#F5F2EB",
    accent: "#FF7A59",
    secondary: "#70D6BC",
    text: "#23211E",
    muted: "#68635B",
    surface: "#FFFFFF",
    font: "Calibri",
    titleFont: "Arial",
    scheme: "light",
    badgeClass: "bg-orange-400/10 text-orange-500 border-orange-400/20",
  },
  vellum: {
    id: "vellum",
    name: "Vellum",
    tagline:
      "Deep navy canvas with warm-yellow Cormorant serifs and dusty teal accents",
    source: "beautiful-html-templates",
    bg: "#081226",
    accent: "#F2DF99",
    secondary: "#3AAFA9",
    text: "#F7FAFC",
    muted: "#829AB1",
    surface: "#102242",
    font: "Georgia",
    titleFont: "Georgia",
    scheme: "dark",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    tagline:
      "Ivory ledger paper with pure black type: quiet, classical editorial elegance",
    source: "beautiful-html-templates",
    bg: "#F8F6F0",
    accent: "#0A0A0A",
    secondary: "#333333",
    text: "#0A0A0A",
    muted: "#666666",
    surface: "#ECE8DD",
    font: "Georgia",
    titleFont: "Georgia",
    scheme: "light",
    badgeClass: "bg-zinc-500/10 text-zinc-700 border-zinc-500/20",
  },
  "neo-grid-bold": {
    id: "neo-grid-bold",
    name: "Neo-Grid Bold",
    tagline:
      "Editorial neo-brutalism with neon lime-yellow accents on structured grid paper",
    source: "beautiful-html-templates",
    bg: "#F4F4F0",
    accent: "#DFFF00",
    secondary: "#000000",
    text: "#111111",
    muted: "#555555",
    surface: "#E7E7DF",
    font: "Arial",
    titleFont: "Arial Black",
    scheme: "light",
    badgeClass: "bg-lime-400/10 text-lime-600 border-lime-400/20",
  },
  "pink-script": {
    id: "pink-script",
    name: "Pink Script",
    tagline:
      "Black canvas, hot pink accent, pearl-cream typography: late-night luxury",
    source: "beautiful-html-templates",
    bg: "#0B0B0C",
    accent: "#FF2E93",
    secondary: "#FFF5EB",
    text: "#FFFFFF",
    muted: "#8E8E93",
    surface: "#18181C",
    font: "Georgia",
    titleFont: "Georgia",
    scheme: "dark",
    badgeClass: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  },
  "pin-and-paper": {
    id: "pin-and-paper",
    name: "Pin & Paper",
    tagline: "Yellow paper with safety-pin accents and ink-blue typography",
    source: "beautiful-html-templates",
    bg: "#FDF8D8",
    accent: "#1A2B4C",
    secondary: "#D9534F",
    text: "#142036",
    muted: "#6E7B8B",
    surface: "#F4ECC2",
    font: "Calibri",
    titleFont: "Georgia",
    scheme: "light",
    badgeClass: "bg-amber-400/10 text-amber-700 border-amber-400/20",
  },
  "warm-gradient": {
    id: "warm-gradient",
    name: "Warm Gradient",
    tagline:
      "Vibrant sunset coral-peach and gold gradient for modern founder stories",
    source: "free-ppt-template",
    bg: "#1C1326",
    accent: "#FF7E5F",
    secondary: "#FEB47B",
    text: "#FFFFFF",
    muted: "#A393B0",
    surface: "#281D36",
    font: "Calibri",
    titleFont: "Arial Black",
    scheme: "dark",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  "minimal-corporate": {
    id: "minimal-corporate",
    name: "Minimal Corporate",
    tagline:
      "Swiss-inspired minimalist corporate consulting deck with deep navy typography",
    source: "free-ppt-template",
    bg: "#FFFFFF",
    accent: "#0F2537",
    secondary: "#205493",
    text: "#1B1B1B",
    muted: "#5B616B",
    surface: "#F0F4F8",
    font: "Calibri",
    titleFont: "Arial",
    scheme: "light",
    badgeClass: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  },
  "cyber-neon": {
    id: "cyber-neon",
    name: "Cyber Neon",
    tagline:
      "Cyberpunk and esports gaming pitch deck with ultraviolet and hyper-cyan neon",
    source: "free-ppt-template",
    bg: "#100826",
    accent: "#00F6FF",
    secondary: "#9D00FF",
    text: "#FFFFFF",
    muted: "#7C6EA3",
    surface: "#1D133D",
    font: "Arial",
    titleFont: "Impact",
    scheme: "dark",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
};

/**
 * Legacy theme fallback mapping to ensure 100% backwards-compatibility
 * with older chat threads and tests.
 */
export const LEGACY_THEME_FALLBACKS: Record<string, string> = {
  tech: "bento-modern",
  business: "minimal-corporate",
  creative: "block-frame",
  education: "soft-editorial",
  nature: "editorial-forest",
  medical: "cobalt-grid",
  energy: "acid-brutalist",
  elegant: "black-gold",
};

/**
 * Resolves any theme ID (case-insensitive, with legacy fallback support)
 */
export function resolvePresentationTheme(
  themeName?: string,
): PresentationThemeConfig {
  if (!themeName) return PRESENTATION_THEMES["bento-modern"];
  const key = themeName.toLowerCase().trim();
  if (PRESENTATION_THEMES[key]) {
    return PRESENTATION_THEMES[key];
  }
  const fallback = LEGACY_THEME_FALLBACKS[key];
  if (fallback && PRESENTATION_THEMES[fallback]) {
    return PRESENTATION_THEMES[fallback];
  }
  return PRESENTATION_THEMES["bento-modern"];
}

/**
 * Utility to strip `#` for pptxgenjs color arguments
 */
export function stripHex(hexColor: string): string {
  return hexColor.replace(/^#/, "");
}

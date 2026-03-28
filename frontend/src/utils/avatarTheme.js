import { DEFAULT_AVATAR } from "@/constants/avatars";

// ── Static avatar → HSL theme map (fallback when no photo colors exist) ──
const AVATAR_THEME_MAP = {
  "avatar_01.svg": { primary: "217 91% 60%", accent: "199 89% 48%", secondary: "225 80% 55%" },
  "avatar_02.svg": { primary: "188 94% 43%", accent: "199 89% 48%", secondary: "195 85% 45%" },
  "avatar_03.svg": { primary: "262 83% 68%", accent: "270 91% 65%", secondary: "255 75% 62%" },
  "avatar_04.svg": { primary: "160 84% 39%", accent: "152 76% 44%", secondary: "156 72% 42%" },
  "avatar_05.svg": { primary: "213 94% 68%", accent: "217 91% 60%", secondary: "220 88% 64%" },
  "avatar_06.svg": { primary: "38 92% 50%", accent: "43 96% 56%", secondary: "35 88% 52%" },
  "avatar_07.svg": { primary: "330 81% 60%", accent: "336 84% 57%", secondary: "325 76% 58%" },
  "avatar_08.svg": { primary: "199 89% 48%", accent: "203 89% 53%", secondary: "196 84% 50%" },
  "avatar_09.svg": { primary: "142 76% 36%", accent: "142 71% 45%", secondary: "138 68% 40%" },
  "avatar_10.svg": { primary: "244 76% 67%", accent: "258 90% 66%", secondary: "250 82% 66%" },
  "avatar_11.svg": { primary: "350 89% 60%", accent: "342 82% 52%", secondary: "346 85% 56%" },
  "avatar_12.svg": { primary: "45 93% 58%", accent: "38 92% 50%", secondary: "42 90% 54%" },
};

const DEFAULT_THEME = AVATAR_THEME_MAP[DEFAULT_AVATAR];

// ── Color conversion helpers ──

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToString(h, s, l) {
  return `${h} ${s}% ${l}%`;
}

function clampForDarkUI(h, s, l) {
  const cS = Math.max(30, Math.min(s, 92));
  const cL = Math.max(40, Math.min(l, 68));
  return [h, cS, cL];
}

function shiftHue(h, amount) {
  return (h + amount + 360) % 360;
}

function hueDist(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

function colorDistance(hsl1, hsl2) {
  const hd = hueDist(hsl1[0], hsl2[0]) / 180;
  const sd = Math.abs(hsl1[1] - hsl2[1]) / 100;
  const ld = Math.abs(hsl1[2] - hsl2[2]) / 100;
  return hd * 2.5 + sd + ld;
}

function isChromatic(h, s, l) {
  return s > 20 && l > 8 && l < 92;
}

const MONOCHROME_THEME = {
  primary: "220 15% 65%",
  secondary: "220 10% 52%",
  accent: "220 20% 58%",
};

function pickDiversePalette(rgbPalette) {
  const hslPalette = rgbPalette.map(([r, g, b]) => rgbToHsl(r, g, b));

  const chromatic = [];
  const achromatic = [];
  hslPalette.forEach((hsl, i) => {
    if (isChromatic(hsl[0], hsl[1], hsl[2])) chromatic.push({ hsl, idx: i });
    else achromatic.push({ hsl, idx: i });
  });

  if (chromatic.length < 2) return null;

  chromatic.sort((a, b) => b.hsl[1] - a.hsl[1]);
  const primary = chromatic[0];

  let bestSecondary = chromatic[1] || primary;
  let bestDist = 0;
  for (let i = 1; i < chromatic.length; i++) {
    const d = colorDistance(primary.hsl, chromatic[i].hsl);
    if (d > bestDist) { bestDist = d; bestSecondary = chromatic[i]; }
  }

  let bestAccent = chromatic[2] || bestSecondary;
  let bestAccDist = 0;
  for (let i = 0; i < chromatic.length; i++) {
    if (chromatic[i] === primary || chromatic[i] === bestSecondary) continue;
    const d1 = colorDistance(primary.hsl, chromatic[i].hsl);
    const d2 = colorDistance(bestSecondary.hsl, chromatic[i].hsl);
    const combined = d1 + d2;
    if (combined > bestAccDist) { bestAccDist = combined; bestAccent = chromatic[i]; }
  }

  return { primary: primary.hsl, secondary: bestSecondary.hsl, accent: bestAccent.hsl };
}

// ── Cache ──
const CACHE_KEY = "lynkr_theme_cache";
const CACHE_VERSION = 7;

// Purge stale caches on load
try {
  const _raw = localStorage.getItem(CACHE_KEY);
  if (_raw) {
    const _c = JSON.parse(_raw);
    if (_c.v !== CACHE_VERSION) localStorage.removeItem(CACHE_KEY);
  }
} catch { localStorage.removeItem(CACHE_KEY); }

function getCachedTheme(avatarKey) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (cache.v === CACHE_VERSION && cache.key === avatarKey && cache.theme) return cache.theme;
  } catch { /* corrupt cache */ }
  return null;
}

function setCachedTheme(avatarKey, theme) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ v: CACHE_VERSION, key: avatarKey, theme }));
  } catch { /* storage full */ }
}

// ── Build theme from a backend-extracted palette (array of {r,g,b,hex}) ──
export function buildThemeFromPalette(palette, selectedIndex = 0) {
  if (!palette || palette.length === 0) return MONOCHROME_THEME;

  const rgbPalette = palette.map((c) => [c.r, c.g, c.b]);
  const picked = pickDiversePalette(rgbPalette);

  if (!picked) {
    const sel = palette[selectedIndex] || palette[0];
    const [h, s, l] = clampForDarkUI(...rgbToHsl(sel.r, sel.g, sel.b));
    return {
      primary: hslToString(h, s, l),
      secondary: hslToString(h, Math.max(s - 15, 20), Math.min(l + 8, 65)),
      accent: hslToString(shiftHue(h, 30), Math.max(s - 10, 25), l),
    };
  }

  const [ph, ps, pl] = clampForDarkUI(...picked.primary);
  const [sh, ss, sl] = clampForDarkUI(...picked.secondary);
  const [ah, as, al] = clampForDarkUI(...picked.accent);

  return {
    primary: hslToString(ph, ps, pl),
    secondary: hslToString(sh, ss, sl),
    accent: hslToString(ah, as, al),
  };
}

// ── Build theme from a single selected color {r,g,b} ──
export function buildThemeFromColor(color) {
  const [h, s, l] = clampForDarkUI(...rgbToHsl(color.r, color.g, color.b));
  return {
    primary: hslToString(h, s, l),
    secondary: hslToString(shiftHue(h, 25), Math.max(s - 10, 25), Math.min(l + 5, 65)),
    accent: hslToString(shiftHue(h, -25), Math.max(s - 5, 30), l),
  };
}

// ── Generate extended theme variables from base colors ──
function generateExtendedTheme(theme) {
  const parseParts = (hslStr) => {
    const parts = hslStr.split(" ");
    return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
  };

  const [ph, ps, pl] = parseParts(theme.primary);
  const [sh, ss, sl] = parseParts(theme.secondary || theme.primary);
  const [ah, as, al] = parseParts(theme.accent);

  return {
    ...theme,
    gradientFrom: hslToString(ph, ps, pl),
    gradientTo: hslToString(ah, as, al),
    glowColor: hslToString(ph, Math.min(ps, 75), Math.max(pl - 5, 38)),
    cardBorder: hslToString(sh, Math.round(ss * 0.35), Math.round(sl * 0.3)),
    softTint: hslToString(ph, Math.round(ps * 0.4), 11),
    accentMuted: hslToString(ah, Math.round(as * 0.5), Math.round(al * 0.55)),
    complementary: hslToString(sh, Math.round(ss * 0.6), Math.round(sl * 0.65)),
  };
}

// ── Apply theme to DOM ──
function setThemeVars(extended) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  root.setProperty("--theme-primary", extended.primary);
  root.setProperty("--theme-ring", extended.primary);
  root.setProperty("--theme-accent", extended.accent);
  root.setProperty("--theme-secondary", extended.secondary || extended.primary);
  root.setProperty("--theme-gradient-from", extended.gradientFrom);
  root.setProperty("--theme-gradient-to", extended.gradientTo);
  root.setProperty("--theme-glow", extended.glowColor);
  root.setProperty("--theme-card-border", extended.cardBorder);
  root.setProperty("--theme-soft-tint", extended.softTint);
  root.setProperty("--theme-accent-muted", extended.accentMuted);
  root.setProperty("--theme-complementary", extended.complementary);
}

// ── Public API ──

export const applyAvatarTheme = (avatar) => {
  const key = avatar || DEFAULT_AVATAR;
  const staticTheme = AVATAR_THEME_MAP[key];
  if (staticTheme) {
    const extended = generateExtendedTheme(staticTheme);
    setThemeVars(extended);
    setCachedTheme(key, extended);
    return;
  }
  // Unknown avatar string (could be a photo URL in the future)
  const cached = getCachedTheme(key);
  if (cached) {
    setThemeVars(cached);
    return;
  }
  // Fallback to default while async extraction runs
  const fallback = generateExtendedTheme(DEFAULT_THEME);
  setThemeVars(fallback);
};

export const applyPhotoTheme = async (imageUrl) => {
  const cached = getCachedTheme(imageUrl);
  if (cached) {
    setThemeVars(cached);
    return cached;
  }
  const fallback = generateExtendedTheme(DEFAULT_THEME);
  setThemeVars(fallback);
  return fallback;
};

export const applyPaletteTheme = (palette, selectedIndex) => {
  const base = selectedIndex != null
    ? buildThemeFromColor(palette[selectedIndex])
    : buildThemeFromPalette(palette);
  const extended = generateExtendedTheme(base);
  setThemeVars(extended);
  return extended;
};

export const applySavedTheme = (themeColors) => {
  if (!themeColors || !themeColors.primary) return;
  const extended = generateExtendedTheme(themeColors);
  setThemeVars(extended);
  setCachedTheme("saved", extended);
};

export const resetAvatarTheme = () => {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  [
    "--theme-primary", "--theme-ring", "--theme-accent", "--theme-secondary",
    "--theme-gradient-from", "--theme-gradient-to", "--theme-glow",
    "--theme-card-border", "--theme-soft-tint", "--theme-accent-muted",
    "--theme-complementary",
  ].forEach((v) => root.removeProperty(v));
};

export const getStaticTheme = (avatar) =>
  generateExtendedTheme(AVATAR_THEME_MAP[avatar || DEFAULT_AVATAR] || DEFAULT_THEME);

// ── Preset color themes ──
export const PRESET_THEMES = [
  { id: "ocean",     name: "Ocean",       primary: "210 90% 56%",  secondary: "190 80% 44%",  accent: "175 70% 48%",  preview: ["#2F80ED", "#1A9CA0", "#32B8A0"] },
  { id: "sunset",    name: "Sunset",      primary: "15 85% 58%",   secondary: "35 90% 55%",   accent: "350 80% 58%",  preview: ["#E8652B", "#E8A42B", "#D94065"] },
  { id: "forest",    name: "Forest",      primary: "150 60% 42%",  secondary: "130 50% 38%",  accent: "85 55% 50%",   preview: ["#2F9E6E", "#3A8B55", "#7AB839"] },
  { id: "lavender",  name: "Lavender",    primary: "270 65% 62%",  secondary: "290 55% 55%",  accent: "240 60% 65%",  preview: ["#9B59D6", "#B355B5", "#6E6ECC"] },
  { id: "rose",      name: "Rose",        primary: "340 75% 58%",  secondary: "320 60% 52%",  accent: "0 70% 60%",    preview: ["#D94478", "#BA3FA0", "#CC4C4C"] },
  { id: "ember",     name: "Ember",       primary: "25 90% 52%",   secondary: "10 80% 50%",   accent: "45 85% 55%",   preview: ["#E87520", "#CC4433", "#D4A520"] },
  { id: "arctic",    name: "Arctic",      primary: "200 70% 58%",  secondary: "220 60% 55%",  accent: "180 50% 52%",  preview: ["#4BA8D4", "#5577BB", "#52B8A8"] },
  { id: "neon",      name: "Neon",        primary: "160 90% 48%",  secondary: "280 85% 60%",  accent: "45 95% 55%",   preview: ["#0FD98C", "#A855F7", "#E8C820"] },
  { id: "midnight",  name: "Midnight",    primary: "235 60% 58%",  secondary: "260 50% 52%",  accent: "210 55% 55%",  preview: ["#5566CC", "#7755AA", "#4488BB"] },
  { id: "copper",    name: "Copper",      primary: "25 55% 52%",   secondary: "15 45% 45%",   accent: "35 50% 58%",   preview: ["#B87840", "#996048", "#C49850"] },
  { id: "sakura",    name: "Sakura",      primary: "330 60% 65%",  secondary: "350 50% 58%",  accent: "310 45% 60%",  preview: ["#D478AA", "#CC6680", "#BB70A8"] },
  { id: "steel",     name: "Steel",       primary: "215 20% 58%",  secondary: "220 15% 50%",  accent: "210 25% 62%",  preview: ["#7888A0", "#6E7A90", "#7090B0"] },
];

export const applyPresetTheme = (presetId) => {
  const preset = PRESET_THEMES.find((p) => p.id === presetId);
  if (!preset) return null;
  const base = { primary: preset.primary, secondary: preset.secondary, accent: preset.accent };
  const extended = generateExtendedTheme(base);
  setThemeVars(extended);
  setCachedTheme(`preset:${presetId}`, extended);
  return extended;
};

// ── Dark / Light mode ──
export const setColorMode = (mode) => {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (mode === "light") {
    html.classList.remove("dark");
  } else {
    html.classList.add("dark");
  }
  try { localStorage.setItem("lynkr_color_mode", mode); } catch {}
};

export const getColorMode = () => {
  try { return localStorage.getItem("lynkr_color_mode") || "dark"; } catch { return "dark"; }
};

export { DEFAULT_THEME, AVATAR_THEME_MAP, generateExtendedTheme };

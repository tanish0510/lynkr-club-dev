import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStaticTheme } from "@/utils/avatarTheme";

/**
 * Returns the current user's resolved theme object.
 * Reads from the CSS custom properties that avatarTheme.js has already set on :root,
 * with a fast static fallback from the avatar map.
 *
 * Usage:
 *   const theme = useUserTheme();
 *   <div style={{ borderColor: `hsl(${theme.primary})` }} />
 */
export default function useUserTheme() {
  const { user } = useAuth();
  const avatar = user?.avatar;

  return useMemo(() => {
    const st = getStaticTheme(avatar);

    const read = (varName) => {
      if (typeof document === "undefined") return null;
      return document.documentElement.style.getPropertyValue(varName).trim() || null;
    };

    return {
      primary: read("--theme-primary") || st.primary,
      accent: read("--theme-accent") || st.accent,
      secondary: read("--theme-secondary") || st.secondary,
      gradientFrom: read("--theme-gradient-from") || st.gradientFrom,
      gradientTo: read("--theme-gradient-to") || st.gradientTo,
      glow: read("--theme-glow") || st.glowColor,
      cardBorder: read("--theme-card-border") || st.cardBorder,
      softTint: read("--theme-soft-tint") || st.softTint,
      accentMuted: read("--theme-accent-muted") || st.accentMuted,
      complementary: read("--theme-complementary") || st.complementary,
      // convenience css helpers
      primaryHsl: `hsl(${read("--theme-primary") || st.primary})`,
      accentHsl: `hsl(${read("--theme-accent") || st.accent})`,
      gradientCss: `linear-gradient(135deg, hsl(${read("--theme-gradient-from") || st.gradientFrom}), hsl(${read("--theme-gradient-to") || st.gradientTo}))`,
      glowCss: `0 0 40px -10px hsl(${read("--theme-glow") || st.glowColor} / 0.35)`,
      softGlowCss: `0 0 60px -15px hsl(${read("--theme-glow") || st.glowColor} / 0.15)`,
      cardBorderCss: `hsl(${read("--theme-card-border") || st.cardBorder} / 0.25)`,
      softTintCss: `hsl(${read("--theme-soft-tint") || st.softTint})`,
    };
  }, [avatar]);
}

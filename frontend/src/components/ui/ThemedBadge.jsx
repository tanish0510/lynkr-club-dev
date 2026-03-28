import React from "react";
import useUserTheme from "@/hooks/useUserTheme";

/**
 * A badge/chip that adapts to the user's profile theme.
 *
 * Variants:
 *  - "default" : primary tinted bg + primary text
 *  - "accent"  : accent tinted bg + accent text
 *  - "outline" : transparent bg + themed border
 */
const ThemedBadge = ({
  children,
  variant = "default",
  className = "",
  ...rest
}) => {
  const theme = useUserTheme();

  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors";

  const styles = {
    default: {
      backgroundColor: `hsl(${theme.primary} / 0.12)`,
      color: theme.primaryHsl,
    },
    accent: {
      backgroundColor: `hsl(${theme.accent} / 0.12)`,
      color: theme.accentHsl,
    },
    outline: {
      border: `1px solid ${theme.cardBorderCss}`,
      color: `hsl(${theme.primary} / 0.7)`,
    },
  };

  return (
    <span
      className={`${base} ${className}`}
      style={styles[variant] || styles.default}
      {...rest}
    >
      {children}
    </span>
  );
};

export default ThemedBadge;

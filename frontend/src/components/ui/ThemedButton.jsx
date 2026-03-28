import React from "react";
import useUserTheme from "@/hooks/useUserTheme";

/**
 * A button that uses the user's dynamic theme colors.
 *
 * Variants:
 *  - "primary"  : solid gradient button
 *  - "soft"     : subtle tinted background
 *  - "outline"  : themed border, transparent bg
 *  - "ghost"    : no border, text-only with accent color
 */
const ThemedButton = ({
  children,
  variant = "primary",
  size = "default",
  className = "",
  disabled,
  ...rest
}) => {
  const theme = useUserTheme();

  const sizeMap = {
    sm: "h-9 px-4 text-xs rounded-xl",
    default: "h-11 px-6 text-sm rounded-xl",
    lg: "h-12 px-8 text-sm rounded-2xl",
  };

  const baseClasses = `inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 touch-manipulation ${
    sizeMap[size] || sizeMap.default
  } ${disabled ? "opacity-40 pointer-events-none" : "active:scale-[0.97]"}`;

  if (variant === "primary") {
    return (
      <button
        className={`${baseClasses} text-primary-foreground btn-glow-user ${className}`}
        style={{ background: theme.gradientCss }}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === "soft") {
    return (
      <button
        className={`${baseClasses} ${className}`}
        style={{
          backgroundColor: `hsl(${theme.primary} / 0.1)`,
          color: theme.primaryHsl,
        }}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        className={`${baseClasses} bg-transparent ${className}`}
        style={{
          border: `1px solid ${theme.cardBorderCss}`,
          color: theme.primaryHsl,
        }}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }

  // ghost
  return (
    <button
      className={`${baseClasses} bg-transparent hover:bg-muted ${className}`}
      style={{ color: theme.primaryHsl }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default ThemedButton;

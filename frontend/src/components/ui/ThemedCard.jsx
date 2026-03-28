import React from "react";
import useUserTheme from "@/hooks/useUserTheme";

/**
 * A card that adapts to the user's profile-derived theme.
 *
 * Variants:
 *  - "default"  : subtle tinted background + themed border
 *  - "glow"     : adds a soft outer glow in user color
 *  - "gradient"  : gradient top border accent line
 *  - "outlined" : just the themed border, no tint
 */
const ThemedCard = ({
  children,
  variant = "default",
  className = "",
  onClick,
  as: Tag = "div",
  ...rest
}) => {
  const theme = useUserTheme();

  const baseStyle = {
    "--_border": theme.cardBorderCss,
    "--_tint": theme.softTintCss,
    "--_glow": theme.glowCss,
    "--_soft-glow": theme.softGlowCss,
    "--_gradient": theme.gradientCss,
  };

  const variants = {
    default: "bg-card border border-border hover:border-[var(--_border)]",
    glow: "bg-card border border-border hover:border-[var(--_border)] hover:shadow-[var(--_soft-glow)]",
    gradient: "bg-card border border-border relative overflow-hidden",
    outlined: "bg-transparent border border-[var(--_border)]",
  };

  const hasGradientBar = variant === "gradient";

  return (
    <Tag
      style={baseStyle}
      className={`rounded-2xl transition-all duration-300 ${variants[variant] || variants.default} ${
        onClick ? "cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
      onClick={onClick}
      {...rest}
    >
      {hasGradientBar && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
          style={{ background: theme.gradientCss }}
        />
      )}
      {children}
    </Tag>
  );
};

export default ThemedCard;

import React from "react";
import useUserTheme from "@/hooks/useUserTheme";

/**
 * A progress bar that uses the user's dynamic gradient theme.
 *
 * @param {number} value - 0 to 100
 * @param {string} [size] - "sm" | "default" | "lg"
 * @param {boolean} [showLabel] - show percentage text
 */
const ThemedProgressBar = ({
  value = 0,
  size = "default",
  showLabel = false,
  className = "",
  ...rest
}) => {
  const theme = useUserTheme();
  const clamped = Math.min(100, Math.max(0, value));

  const heightMap = { sm: "h-1.5", default: "h-2", lg: "h-3" };

  return (
    <div className={`w-full ${className}`} {...rest}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-txt-muted font-medium">Progress</span>
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color: theme.primaryHsl }}
          >
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div className={`w-full rounded-full bg-muted overflow-hidden ${heightMap[size] || heightMap.default}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clamped}%`,
            background: theme.gradientCss,
          }}
        />
      </div>
    </div>
  );
};

export default ThemedProgressBar;

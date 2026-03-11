import { DEFAULT_AVATAR } from "@/constants/avatars";

const AVATAR_THEME_MAP = {
  "avatar_01.svg": { primary: "217 91% 60%", accent: "199 89% 48%" },
  "avatar_02.svg": { primary: "188 94% 43%", accent: "199 89% 48%" },
  "avatar_03.svg": { primary: "262 83% 68%", accent: "270 91% 65%" },
  "avatar_04.svg": { primary: "160 84% 39%", accent: "152 76% 44%" },
  "avatar_05.svg": { primary: "213 94% 68%", accent: "217 91% 60%" },
  "avatar_06.svg": { primary: "38 92% 50%", accent: "43 96% 56%" },
  "avatar_07.svg": { primary: "330 81% 60%", accent: "336 84% 57%" },
  "avatar_08.svg": { primary: "199 89% 48%", accent: "203 89% 53%" },
  "avatar_09.svg": { primary: "142 76% 36%", accent: "142 71% 45%" },
  "avatar_10.svg": { primary: "244 76% 67%", accent: "258 90% 66%" },
  "avatar_11.svg": { primary: "350 89% 60%", accent: "342 82% 52%" },
  "avatar_12.svg": { primary: "45 93% 58%", accent: "38 92% 50%" },
};

const DEFAULT_THEME = AVATAR_THEME_MAP[DEFAULT_AVATAR];

const getThemeByAvatar = (avatar) => AVATAR_THEME_MAP[avatar] || DEFAULT_THEME;

export const applyAvatarTheme = (avatar) => {
  if (typeof document === "undefined") return;
  const theme = getThemeByAvatar(avatar);
  document.documentElement.style.setProperty("--theme-primary", theme.primary);
  document.documentElement.style.setProperty("--theme-ring", theme.primary);
  document.documentElement.style.setProperty("--theme-accent", theme.accent);
};

export const resetAvatarTheme = () => {
  if (typeof document === "undefined") return;
  document.documentElement.style.removeProperty("--theme-primary");
  document.documentElement.style.removeProperty("--theme-ring");
  document.documentElement.style.removeProperty("--theme-accent");
};


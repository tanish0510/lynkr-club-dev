export const AVATAR_OPTIONS = [
  "avatar_01.svg",
  "avatar_02.svg",
  "avatar_03.svg",
  "avatar_04.svg",
  "avatar_05.svg",
  "avatar_06.svg",
  "avatar_07.svg",
  "avatar_08.svg",
  "avatar_09.svg",
  "avatar_10.svg",
  "avatar_11.svg",
  "avatar_12.svg",
];

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0];

export const getAvatarSrc = (avatar) => `/avatars/${avatar || DEFAULT_AVATAR}`;

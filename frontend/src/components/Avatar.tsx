import React from "react";
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarSrc } from "@/constants/avatars";
import { resolveImageUrl } from "@/utils/api";

const AppAvatar = ({ avatar, profilePhoto, username, className = "", imageClassName = "" }) => {
  const fallback = (username || "LY").slice(0, 2).toUpperCase();
  const src = profilePhoto ? resolveImageUrl(profilePhoto) : getAvatarSrc(avatar);

  return (
    <UiAvatar className={className}>
      <AvatarImage className={imageClassName} src={src} alt={username || "Lynkr user"} />
      <AvatarFallback className="bg-secondary text-xs text-muted-foreground">{fallback}</AvatarFallback>
    </UiAvatar>
  );
};

export default AppAvatar;

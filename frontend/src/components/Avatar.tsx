import React from "react";
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarSrc } from "@/constants/avatars";

const AppAvatar = ({ avatar, username, className = "", imageClassName = "" }) => {
  const fallback = (username || "LY").slice(0, 2).toUpperCase();

  return (
    <UiAvatar className={className}>
      <AvatarImage className={imageClassName} src={getAvatarSrc(avatar)} alt={username || "Lynkr user"} />
      <AvatarFallback className="bg-secondary text-xs text-muted-foreground">{fallback}</AvatarFallback>
    </UiAvatar>
  );
};

export default AppAvatar;

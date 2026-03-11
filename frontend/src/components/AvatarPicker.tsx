import React from "react";
import AppAvatar from "@/components/Avatar";
import { AVATAR_OPTIONS } from "@/constants/avatars";

const AvatarPicker = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {AVATAR_OPTIONS.map((avatar) => {
        const isActive = value === avatar;
        return (
          <button
            key={avatar}
            type="button"
            onClick={() => onChange(avatar)}
            className={`rounded-2xl border p-1.5 transition-all duration-200 ${
              isActive
                ? "border-primary bg-primary/10 scale-105"
                : "border-white/10 bg-secondary/30 hover:border-white/20 hover:scale-[1.03]"
            }`}
          >
            <AppAvatar avatar={avatar} username="avatar" className="h-12 w-12 mx-auto" />
          </button>
        );
      })}
    </div>
  );
};

export default AvatarPicker;

import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/utils/api";

const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;

const UsernameInput = ({ value, onChange, onValidityChange, currentUsername = "" }) => {
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState({ available: false, hint: "Choose a unique username" });

  const normalized = useMemo(() => (value || "").trim().toLowerCase(), [value]);
  const formatValid = USERNAME_RULE.test(normalized);

  useEffect(() => {
    let cancelled = false;
    if (!normalized) {
      setAvailability({ available: false, hint: "Username is required" });
      onValidityChange?.(false);
      return;
    }
    if (!formatValid) {
      setAvailability({ available: false, hint: "Use 3-20 lowercase letters, numbers, underscore" });
      onValidityChange?.(false);
      return;
    }
    if (normalized === (currentUsername || "").trim().toLowerCase()) {
      setAvailability({ available: true, hint: "Current username" });
      onValidityChange?.(true);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const response = await api.get("/auth/check-username", { params: { username: normalized } });
        if (cancelled) return;
        const data = response.data || {};
        setAvailability({ available: Boolean(data.available), hint: data.hint || "" });
        onValidityChange?.(Boolean(data.available));
      } catch (_) {
        if (cancelled) return;
        // Keep UX smooth on transient network/CORS issues; server re-validates on submit.
        setAvailability({ available: true, hint: "Availability will be confirmed on submit" });
        onValidityChange?.(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalized, formatValid, onValidityChange, currentUsername]);

  return (
    <div>
      <Label htmlFor="signup-username" className="text-sm font-medium mb-2 block">
        Username
      </Label>
      <div className="relative">
        <Input
          id="signup-username"
          value={normalized}
          onChange={(event) => onChange((event.target.value || "").toLowerCase())}
          placeholder="your_handle"
          className="bg-secondary/50 border-white/10 rounded-xl h-12 pr-10"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {checking ? <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted-foreground" /> : null}
      </div>
      <p className={`mt-2 text-xs ${availability.available ? "text-emerald-300" : "text-muted-foreground"}`}>
        {availability.hint}
      </p>
    </div>
  );
};

export default UsernameInput;

"use client";

import { useEffect, useMemo } from "react";
import { Globe, Languages } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadLocale, saveLocale, setLocale } from "@/store/slices/localeSlice";
import {
  COUNTRIES,
  languagesForCountry,
  isValidPair,
} from "@/lib/locale/catalog";
import { cn } from "@/lib/utils";

interface LocaleSelectorProps {
  /** Tighter padding + smaller controls — used inside a popover. */
  compact?: boolean;
}

export default function LocaleSelector({ compact }: LocaleSelectorProps) {
  const dispatch = useAppDispatch();
  const { country, primaryLanguage, status } = useAppSelector((s) => s.locale);

  // Lazy-load the user's saved locale on first mount.
  useEffect(() => {
    if (status === "idle") void dispatch(loadLocale());
  }, [status, dispatch]);

  const availableLangs = useMemo(() => languagesForCountry(country), [country]);

  // Keep selectedLanguage valid as the country changes.
  useEffect(() => {
    if (!isValidPair(country, primaryLanguage) && availableLangs.length > 0) {
      const fallback = availableLangs[0].code;
      dispatch(setLocale({ country, primaryLanguage: fallback }));
      void dispatch(saveLocale({ country, primaryLanguage: fallback }));
    }
  }, [country, primaryLanguage, availableLangs, dispatch]);

  const handleCountry = (next: string) => {
    if (next === country) return;
    const langsForNext = languagesForCountry(next);
    const language = langsForNext[0]?.code ?? primaryLanguage;
    dispatch(setLocale({ country: next, primaryLanguage: language }));
    void dispatch(saveLocale({ country: next, primaryLanguage: language }));
  };

  const handleLanguage = (next: string) => {
    if (next === primaryLanguage) return;
    dispatch(setLocale({ country, primaryLanguage: next }));
    void dispatch(saveLocale({ country, primaryLanguage: next }));
  };

  const fieldClass = cn(
    "w-full rounded-lg bg-zinc-900/80 border border-white/10 text-zinc-100",
    "focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40",
    compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
  );

  return (
    <div className={cn("grid grid-cols-1 gap-3", compact ? "min-w-[220px]" : "md:grid-cols-2")}>
      <label className="block">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5 font-bold">
          <Globe className="size-3" />
          Country
        </span>
        <select
          value={country}
          onChange={(e) => handleCountry(e.target.value)}
          className={fieldClass}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-zinc-500 mb-1.5 font-bold">
          <Languages className="size-3" />
          Language
        </span>
        <select
          value={primaryLanguage}
          onChange={(e) => handleLanguage(e.target.value)}
          className={fieldClass}
        >
          {availableLangs.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

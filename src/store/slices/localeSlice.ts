import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_COUNTRY, DEFAULT_LANGUAGE, isValidPair } from "@/lib/locale/catalog";

/**
 * Locale slice — country + primary language for STT/TTS routing.
 * Persisted to user.locale via PATCH /api/profile/locale.
 *
 * Defaults to en-IN (India is the primary market) until /api/profile
 * resolves the user's saved choice.
 */

interface LocaleState {
  country: string;          // ISO 3166-1 alpha-2
  primaryLanguage: string;  // BCP-47
  status: "idle" | "loading" | "ready";
}

const initialState: LocaleState = {
  country: DEFAULT_COUNTRY,
  primaryLanguage: DEFAULT_LANGUAGE,
  status: "idle",
};

export const loadLocale = createAsyncThunk<{ country: string; primaryLanguage: string }>(
  "locale/load",
  async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return { country: DEFAULT_COUNTRY, primaryLanguage: DEFAULT_LANGUAGE };
      const json = (await res.json()) as {
        user?: { locale?: { country?: string; primaryLanguage?: string } };
      };
      const country = json.user?.locale?.country ?? DEFAULT_COUNTRY;
      const language = json.user?.locale?.primaryLanguage ?? DEFAULT_LANGUAGE;
      // Defensive: profile might have a stale combo from before a catalog update.
      return isValidPair(country, language)
        ? { country, primaryLanguage: language }
        : { country: DEFAULT_COUNTRY, primaryLanguage: DEFAULT_LANGUAGE };
    } catch {
      return { country: DEFAULT_COUNTRY, primaryLanguage: DEFAULT_LANGUAGE };
    }
  },
  {
    condition: (_arg, { getState }) => {
      const s = (getState() as { locale: LocaleState }).locale;
      return s.status === "idle";
    },
  }
);

export const saveLocale = createAsyncThunk<
  void,
  { country: string; primaryLanguage: string }
>("locale/save", async ({ country, primaryLanguage }) => {
  try {
    await fetch("/api/profile/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, primaryLanguage }),
    });
  } catch (err) {
    console.warn("[localeSlice] save failed (kept locally):", err);
  }
});

const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setLocale(
      state,
      action: PayloadAction<{ country: string; primaryLanguage: string }>
    ) {
      state.country = action.payload.country;
      state.primaryLanguage = action.payload.primaryLanguage;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadLocale.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(loadLocale.fulfilled, (s, a) => {
      s.country = a.payload.country;
      s.primaryLanguage = a.payload.primaryLanguage;
      s.status = "ready";
    });
    b.addCase(loadLocale.rejected, (s) => {
      s.status = "ready";
    });
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;

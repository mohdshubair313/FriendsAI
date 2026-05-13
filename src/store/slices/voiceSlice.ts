import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { VoiceStyleId } from "@/lib/voices/catalog";

/**
 * Voice slice — which AI voice style the user picked in onboarding.
 * Persisted to user.preferences.ttsVoiceId. The voice-service resolves
 * (style × language) → Sarvam speaker name at synthesis time.
 */

interface VoiceState {
  style: VoiceStyleId;
  status: "idle" | "loading" | "ready";
}

const initialState: VoiceState = {
  style: "warm_female",
  status: "idle",
};

export const loadVoice = createAsyncThunk<VoiceStyleId>(
  "voice/load",
  async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return "warm_female";
      const json = (await res.json()) as {
        user?: { preferences?: { ttsVoiceId?: VoiceStyleId } };
      };
      return (json.user?.preferences?.ttsVoiceId as VoiceStyleId) ?? "warm_female";
    } catch {
      return "warm_female";
    }
  },
  {
    condition: (_arg, { getState }) => {
      const s = (getState() as { voice: VoiceState }).voice;
      return s.status === "idle";
    },
  }
);

export const saveVoice = createAsyncThunk<void, VoiceStyleId>(
  "voice/save",
  async (style) => {
    try {
      await fetch("/api/profile/voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsVoiceId: style }),
      });
    } catch (err) {
      console.warn("[voiceSlice] save failed (kept locally):", err);
    }
  }
);

const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    setVoiceStyle(state, action: PayloadAction<VoiceStyleId>) {
      state.style = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadVoice.pending, (s) => { s.status = "loading"; });
    b.addCase(loadVoice.fulfilled, (s, a) => { s.style = a.payload; s.status = "ready"; });
    b.addCase(loadVoice.rejected, (s) => { s.status = "ready"; });
  },
});

export const { setVoiceStyle } = voiceSlice.actions;
export default voiceSlice.reducer;

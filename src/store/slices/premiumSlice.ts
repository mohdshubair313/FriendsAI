import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeatureFlags {
  imageGeneration: boolean;
  voiceConversational: boolean;
  advancedAgents: boolean;
  liveAvatar: boolean;
}

interface PremiumState {
  isPremium: boolean;
  tier: "free" | "pro";
  features: FeatureFlags;
  remaining: {
    imagesToday: number;
    voiceSecondsToday: number;
  };
  status: "idle" | "loading" | "success" | "error";
}

const initialState: PremiumState = {
  isPremium: false,
  tier: "free",
  features: {
    imageGeneration: false,
    voiceConversational: false,
    advancedAgents: false,
    liveAvatar: false,
  },
  remaining: { imagesToday: 0, voiceSecondsToday: 0 },
  status: "idle",
};

// ─── Thunk ───────────────────────────────────────────────────────────────────

export const fetchPremiumStatus = createAsyncThunk(
  "premium/fetchStatus",
  async () => {
    const res = await fetch("/api/check-subscription");
    if (!res.ok) throw new Error("Failed to check subscription");
    return res.json();
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const premiumSlice = createSlice({
  name: "premium",
  initialState,
  reducers: {
    setPremium(state, action: PayloadAction<boolean>) {
      state.isPremium = action.payload;
      state.tier = action.payload ? "pro" : "free";
      state.status = "success";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPremiumStatus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPremiumStatus.fulfilled, (state, action) => {
        state.status = "success";
        state.isPremium = action.payload.isPremium ?? false;
        state.tier = action.payload.tier ?? "free";
        state.features = action.payload.features ?? initialState.features;
        state.remaining = action.payload.remaining ?? initialState.remaining;
      })
      .addCase(fetchPremiumStatus.rejected, (state) => {
        state.status = "error";
        state.isPremium = false;
        state.tier = "free";
      });
  },
});

export const { setPremium } = premiumSlice.actions;
export default premiumSlice.reducer;

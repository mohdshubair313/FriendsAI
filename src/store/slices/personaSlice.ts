import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { BuddyPersona } from "@/models/userModel";

/**
 * Persona slice — which AI character is active right now.
 * Persisted server-side via PATCH /api/profile/persona so the choice
 * survives across devices, not just localStorage.
 */

interface PersonaState {
  selected: BuddyPersona;
  status: "idle" | "loading" | "ready";
}

const initialState: PersonaState = {
  selected: "friendly",
  status: "idle",
};

/**
 * Pulls the user's last-saved persona from /api/profile.
 * Falls back silently to "friendly" on any failure (signed-out, network).
 */
export const loadPersona = createAsyncThunk<BuddyPersona>(
  "persona/load",
  async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return "friendly";
      const json = (await res.json()) as {
        user?: { preferences?: { buddyPersona?: BuddyPersona } };
      };
      return json.user?.preferences?.buddyPersona ?? "friendly";
    } catch {
      return "friendly";
    }
  },
  {
    // Skip if we already have the user's persona (it doesn't change often).
    condition: (_arg, { getState }) => {
      const s = (getState() as { persona: PersonaState }).persona;
      return s.status === "idle";
    },
  }
);

/**
 * Persists the user's choice. Optimistic — UI updates immediately,
 * server-side errors are logged but don't roll back the local state
 * (worst case the choice doesn't survive a hard refresh).
 */
export const savePersona = createAsyncThunk<void, BuddyPersona>(
  "persona/save",
  async (persona) => {
    try {
      await fetch("/api/profile/persona", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buddyPersona: persona }),
      });
    } catch (err) {
      console.warn("[personaSlice] save failed (kept locally):", err);
    }
  }
);

const personaSlice = createSlice({
  name: "persona",
  initialState,
  reducers: {
    /** Optimistic local update — pair with savePersona thunk. */
    setPersona(state, action: PayloadAction<BuddyPersona>) {
      state.selected = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadPersona.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(loadPersona.fulfilled, (s, a) => {
      s.selected = a.payload;
      s.status = "ready";
    });
    b.addCase(loadPersona.rejected, (s) => {
      s.status = "ready"; // give up but don't block UI
    });
  },
});

export const { setPersona } = personaSlice.actions;
export default personaSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  /**
   * `null` means "let the AI auto-detect mood from the conversation".
   * A string (e.g. "funny") means the user explicitly picked that mood
   * and it overrides any AI detection.
   */
  selectedMood: string | null;
}

const initialState: ChatState = {
  selectedMood: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMood(state, action: PayloadAction<string>) {
      state.selectedMood = action.payload;
    },
    clearMood(state) {
      state.selectedMood = null;
    },
  },
});

export const { setMood, clearMood } = chatSlice.actions;
export default chatSlice.reducer;

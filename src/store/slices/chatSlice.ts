import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  selectedMood: string;
}

const initialState: ChatState = {
  selectedMood: "friendly",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMood(state, action: PayloadAction<string>) {
      state.selectedMood = action.payload;
    },
  },
});

export const { setMood } = chatSlice.actions;
export default chatSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import premiumReducer from "./slices/premiumSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    premium: premiumReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import premiumReducer from "./slices/premiumSlice";
import personaReducer from "./slices/personaSlice";
import localeReducer from "./slices/localeSlice";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    premium: premiumReducer,
    persona: personaReducer,
    locale: localeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

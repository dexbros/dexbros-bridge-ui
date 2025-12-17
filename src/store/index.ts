import { configureStore } from "@reduxjs/toolkit";
import bridgeReducer from "./slices/bridgeSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "bridge",
  storage,
  whitelist: ["address", "walletType"],
};

const persistedBridgeReducer = persistReducer(persistConfig, bridgeReducer);

export const store = configureStore({
  reducer: {
    bridge: persistedBridgeReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

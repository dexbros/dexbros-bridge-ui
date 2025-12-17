import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type WalletType = "metamask" | "dexbros" | null;

interface BridgeState {
  address: string | null;
  walletType: WalletType;
}

const initialState: BridgeState = {
  address: null,
  walletType: null,
};

const bridgeSlice = createSlice({
  name: "bridge",
  initialState,
  reducers: {
    setWallet(
      state,
      action: PayloadAction<{ address: string; walletType: WalletType }>
    ) {
      state.address = action.payload.address;
      state.walletType = action.payload.walletType;
    },

    clearWallet(state) {
      state.address = null;
      state.walletType = null;
    },
  },
});

export const { setWallet, clearWallet } = bridgeSlice.actions;
export default bridgeSlice.reducer;

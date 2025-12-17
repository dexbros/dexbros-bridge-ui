// src/hooks/useWallet.ts
import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { setWallet, clearWallet } from "../store/slices/bridgeSlice";
import { persistor } from "../store";
import { connectDexbrosWallet } from "../utils/dexbrosBridge";

type WalletProvider = Eip1193Provider & {
  on?: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: WalletProvider;
  }
}

export function useWallet() {
  const dispatch = useDispatch();
  const { address, walletType } = useSelector((s: RootState) => s.bridge);
  const connected = Boolean(address && walletType);

  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  /* ───────── MetaMask ───────── */

  const initMetaMask = useCallback(
    async (eth: WalletProvider) => {
      const ethersProvider = new BrowserProvider(eth);
      setProvider(ethersProvider);

      const accounts = (await eth.request({
        method: "eth_accounts",
      })) as string[];

      if (accounts.length) {
        dispatch(setWallet({ address: accounts[0], walletType: "metamask" }));
      }

      eth.on?.("accountsChanged", (accs: string[]) => {
        if (accs.length) {
          dispatch(setWallet({ address: accs[0], walletType: "metamask" }));
        } else {
          disconnect();
        }
      });

      eth.on?.("disconnect", disconnect);
    },
    [dispatch]
  );

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum || connected) return;
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await initMetaMask(window.ethereum);
  }, [connected, initMetaMask]);

  /* ───────── Dexbros (iframe) ───────── */

  const connectDexbros = useCallback(async () => {
    if (connected) return;

    const res = await connectDexbrosWallet();

    dispatch(
      setWallet({
        address: res.address,
        walletType: "dexbros",
      })
    );
  }, [connected, dispatch]);

  /* ───────── Restore MetaMask on refresh ───────── */

  useEffect(() => {
    if (!address || provider) return;

    if (walletType === "metamask" && window.ethereum) {
      initMetaMask(window.ethereum);
    }
  }, [address, walletType, provider, initMetaMask]);

  /* ───────── Disconnect ───────── */

  const disconnect = useCallback(async () => {
    dispatch(clearWallet());
    setProvider(null);
    await persistor.purge();
  }, [dispatch]);

  return {
    provider,
    address,
    walletType,
    connected,
    connectMetaMask,
    connectDexbros,
    disconnectWallet: disconnect,
  };
}

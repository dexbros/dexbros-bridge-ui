// src/components/DexbrosWalletFrame.tsx
import { useEffect } from "react";

const WALLET_ORIGIN = import.meta.env.VITE_WALLET_ORIGIN;
const WALLET_URL = `${WALLET_ORIGIN}/connector/wallet`;

export default function DexbrosWalletFrame() {
  useEffect(() => {
    if (document.getElementById("dexbros-wallet-iframe")) return;

    const iframe = document.createElement("iframe");
    iframe.id = "dexbros-wallet-iframe";
    iframe.src = WALLET_URL;
    iframe.style.display = "none";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.zIndex = "9999";

    document.body.appendChild(iframe);

    return () => {
      document.body.removeChild(iframe);
    };
  }, []);

  return null;
}

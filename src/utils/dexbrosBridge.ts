const WALLET_ORIGIN = import.meta.env.VITE_WALLET_ORIGIN;

export function connectDexbrosWallet(): Promise<{ address: string }> {
  return new Promise((resolve, reject) => {
    const iframe = document.getElementById(
      "dexbros-wallet-iframe"
    ) as HTMLIFrameElement;

    if (!iframe?.contentWindow) {
      reject("Dexbros iframe not ready");
      return;
    }

    let resolved = false;

    const handler = (e: MessageEvent) => {
      if (e.origin !== WALLET_ORIGIN) return;

      const { type, payload } = e.data || {};
      if (!type) return;

      // ignore noise
      if (type === "IFRAME_READY") return;
      if (type === "RESET_COMPLETE") return;

      // noWallet → keep iframe open, DO NOTHING
      if (type === "RESPONSE_CONNECT" && payload?.errorType === "noWallet") {
        console.warn("No wallet found – keeping iframe open");
        return;
      }

      // success
      if (type === "RESPONSE_CONNECT") {
        resolved = true;
        window.removeEventListener("message", handler);
        iframe.style.display = "none";
        resolve(payload);
        return;
      }

      // explicit cancel only
      if (type === "CLOSE_IFRAME" && !resolved) {
        window.removeEventListener("message", handler);
        iframe.style.display = "none";
        reject("User cancelled");
      }
    };

    window.addEventListener("message", handler);

    // show iframe
    iframe.style.display = "block";

    iframe.contentWindow.postMessage(
      { type: "REQUEST_CONNECT" },
      WALLET_ORIGIN
    );
  });
}

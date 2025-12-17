// src/utils/requestDexbrosApproval.ts

const WALLET_ORIGIN = import.meta.env.VITE_WALLET_ORIGIN;

export function requestDexbrosApproval(txDetails: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const iframe = document.getElementById(
      "dexbros-wallet-iframe"
    ) as HTMLIFrameElement | null;

    if (!iframe?.contentWindow) {
      //console.error("[DEXBROS][INIT] iframe not ready");
      reject("Dexbros iframe not ready");
      return;
    }

    let resolved = false;

    const handler = (e: MessageEvent) => {
      // LOG EVERYTHING FIRST
      // console.log("[DEXBROS][RAW MESSAGE]", {
      //   origin: e.origin,
      //   data: e.data,
      // });

      if (e.origin !== WALLET_ORIGIN) {
        console.warn("[DEXBROS][IGNORED ORIGIN]", e.origin);
        return;
      }

      const { type, payload } = e.data || {};
      if (!type) {
        console.warn("[DEXBROS][NO TYPE]", e.data);
        return;
      }

      // ───────── Noise ─────────
      if (type === "IFRAME_READY") {
        //console.log("[DEXBROS] iframe ready");
        return;
      }

      if (type === "RESET_COMPLETE") {
        //console.log("[DEXBROS] wallet reset complete");
        return;
      }

      // ───────── IMPORTANT ─────────
      // Wallet uses CLOSE_IFRAME to mean "tx continues in background"
      if (type === "CLOSE_IFRAME") {
        //console.log("[DEXBROS] iframe closed, tx still processing");
        iframe.style.display = "none";
        return; // DO NOT reject, DO NOT remove listener
      }

      // ───────── FINAL RESPONSE ─────────
      if (type === "RESPONSE_SIGN") {
        //console.log("[DEXBROS][RESPONSE_SIGN]", payload);

        resolved = true;
        window.removeEventListener("message", handler);
        iframe.style.display = "none";

        if (payload?.error) {
          console.error("[DEXBROS][ERROR]", payload);
          reject(payload);
        } else {
          console.log("[DEXBROS][SUCCESS]", payload);
          resolve(payload);
        }
        return;
      }

      //console.warn("[DEXBROS][UNKNOWN TYPE]", type, payload);
    };

    window.addEventListener("message", handler);

    // ───────── SHOW IFRAME ─────────
    //console.log("[DEXBROS] sending REQUEST_SIGN", txDetails);

    iframe.style.display = "block";

    iframe.contentWindow.postMessage(
      {
        type: "REQUEST_SIGN",
        payload: {
          txDetails,
          signOnly: false,
        },
      },
      WALLET_ORIGIN
    );
  });
}

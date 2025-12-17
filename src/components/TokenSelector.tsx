// src/components/TokenSelector.tsx
import React, { useEffect, useState } from "react";
import { Contract, ethers, TransactionReceipt } from "ethers";
import { useSelector } from "react-redux";
import { useWallet } from "../hooks/useWallet";
import type { RootState } from "../store";
import { TOKENS } from "../constants/tokens";
import { ERC20_ABI } from "../constants/erc20Abi";
import { BRIDGE_ABI } from "../constants/bridgeAbi";
import type { BridgeToken } from "../constants/tokens";
import { getTokenBalance } from "../utils/getTokenBalance";
import { checkAllowance } from "../apis/bridgeApi";
import { requestDexbrosApproval } from "../utils/requestDexbrosApproval";

interface Props {
  direction: "from";
}

const TokenSelector: React.FC<Props> = () => {
  const { address, provider } = useWallet();
  const { walletType } = useSelector((s: RootState) => s.bridge);

  // Original state
  const [selectedToken, setSelectedToken] = useState<BridgeToken>(TOKENS[0]);
  const [counterToken, setCounterToken] = useState<BridgeToken>(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [fromBalance, setFromBalance] = useState("0.00");
  const [toBalance, setToBalance] = useState("0.00");
  const [step, setStep] = useState<"form" | "approve" | "confirm" | "done">(
    "form"
  );

  const BRIDGE_ADDRESS = import.meta.env.VITE_BRIDGE_ADDRESS!;

  // Loading & feedback state
  const [loadingAllowance, setLoadingAllowance] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [signingBridge, setSigningBridge] = useState(false);
  const [submittingBridge, setSubmittingBridge] = useState(false);

  const anyLoading =
    loadingAllowance || loadingApprove || signingBridge || submittingBridge;

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txReceipt, setTxReceipt] = useState<TransactionReceipt | null>(null);

  // Helpers
  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const goBackToForm = () => {
    setStep("form");
    setAmount("");
    setTxReceipt(null);
    clearFeedback();
  };

  // Update counterToken
  useEffect(() => {
    const c = TOKENS.find((t) => t.symbol === selectedToken.counterSymbol);
    if (c) setCounterToken(c);
  }, [selectedToken]);

  // Fetch balances
  useEffect(() => {
    async function fetchBalances() {
      if (!address) return;
      const [fb, tb] = await Promise.all([
        getTokenBalance(selectedToken, address),
        getTokenBalance(counterToken, address),
      ]);
      setFromBalance(fb);
      setToBalance(tb);
    }
    fetchBalances();
  }, [selectedToken, counterToken, address]);

  const isAmountValid = () => {
    const a = parseFloat(amount);
    const b = parseFloat(fromBalance);
    return !isNaN(a) && a > 0 && a <= b;
  };

  // STEP 1: Check allowance
  const onContinue = async () => {
    if (!isAmountValid() || !address) return;
    if (walletType === "metamask" && !provider) return;

    clearFeedback();

    // No allowance needed for native coin
    if (selectedToken.address === ethers.ZeroAddress) {
      setStep("confirm");
      return;
    }

    setLoadingAllowance(true);
    try {
      const raw = await checkAllowance({
        token: selectedToken.address,
        owner: address,
        spender: BRIDGE_ADDRESS,
        chainId: selectedToken.chainId,
      });

      const parsed = parseFloat(
        ethers.formatUnits(raw, selectedToken.decimals)
      );

      setSuccessMsg("Allowance checked");
      setStep(parsed >= parseFloat(amount) ? "confirm" : "approve");
    } catch {
      setErrorMsg("Failed to check allowance");
    } finally {
      setLoadingAllowance(false);
    }
  };

  // STEP 2: Approve token
  const onApprove = async () => {
    if (!address) return;

    clearFeedback();
    setLoadingApprove(true);

    try {
      if (walletType === "dexbros") {
        await requestDexbrosApproval({
          txType: "approval",
          ownerAddr: address,
          actionType: "bridge",
          isNFT: false,
          blockchain: "sepolia", // make dynamic later
          standard: "ERC20",
          nftContract: selectedToken.address,
          markeplaceContract: BRIDGE_ADDRESS,
          amount: ethers.parseUnits(amount, selectedToken.decimals),
        });
      } else {
        // MetaMask (UNCHANGED)
        const signer = await provider!.getSigner();
        const contract = new Contract(selectedToken.address, ERC20_ABI, signer);
        const tx = await contract.approve(BRIDGE_ADDRESS, ethers.MaxUint256);
        await tx.wait();
      }

      setSuccessMsg("Approved successfully");
      setStep("confirm");
    } catch (e) {
      console.error(e);
      setErrorMsg("Approval failed");
    } finally {
      setLoadingApprove(false);
    }
  };

  // STEP 3: Bridge asset
  const onBridge = async () => {
    if (!address) return;
    if (walletType === "metamask" && !provider) return;

    clearFeedback();

    try {
      const amountBN = ethers.parseUnits(amount, selectedToken.decimals);
      const dest = selectedToken.symbol !== "DXZ" ? 1 : 0;

      // IMPORTANT:
      // Dexbros "requestDexbrosApproval" blocks until tx is confirmed (Option A).
      // So we show one continuous loader during the whole process.
      if (walletType === "dexbros") {
        setSigningBridge(true);
        setSubmittingBridge(true);
        setSuccessMsg("Bridging (confirming on-chain)…");

        const res = await requestDexbrosApproval({
          txType: "bridge",
          chainName: "sepolia",
          standard: "ERC20",
          contractAddress: BRIDGE_ADDRESS,
          ownerAddr: address,
          args: [dest, address, amountBN, selectedToken.address, true, "0x"],
          value: 0n,
        });

        const txHash = res?.txHash || res?.hash;
        if (!txHash) throw new Error("Dexbros wallet did not return txHash");

        // Already confirmed by txKit -> safe to mark as done
        setTxReceipt({
          hash: txHash,
          blockNumber: res?.blockNumber,
        } as any);

        setSuccessMsg(
          `Bridged ${parseFloat(amount).toFixed(4)} ${selectedToken.symbol}`
        );
        setStep("done");

        setSigningBridge(false);
        setSubmittingBridge(false);

        return;
      }

      // MetaMask (UNCHANGED)
      setSigningBridge(true);

      const signer = await provider!.getSigner();
      const bridge = new Contract(BRIDGE_ADDRESS, BRIDGE_ABI, signer);

      setSubmittingBridge(false);

      const tx = await bridge.bridgeAsset(
        dest,
        address,
        amountBN,
        selectedToken.address,
        true,
        "0x",
        { value: 0n }
      );

      setSigningBridge(false);
      setSubmittingBridge(true);

      const receipt = await tx.wait();
      setTxReceipt(receipt);
      setSubmittingBridge(false);

      setSuccessMsg(
        `Bridged ${parseFloat(amount).toFixed(4)} ${selectedToken.symbol}`
      );
      setStep("done");
    } catch (e) {
      console.error(e);
      setErrorMsg("Bridge transaction failed");
    } finally {
      setSigningBridge(false);
      setSubmittingBridge(false);
    }
  };

  return (
    <div className="bridge-card">
      {/* Feedback */}
      {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
      {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}

      {/* FORM */}
      {step === "form" && (
        <>
          <div className="bridge-section">
            <div className="bridge-row">
              <span>From</span>
              <span className="balance">
                Balance: <b>{parseFloat(fromBalance).toFixed(2)}</b>{" "}
                {selectedToken.symbol}
              </span>
            </div>
            <div className="bridge-chain">
              <img src={selectedToken.logo} alt="" />
              <span>{selectedToken.chainName}</span>
            </div>
            <div className="bridge-token">
              <div className="left-group">
                <img src={selectedToken.logo} alt="" />
                <select
                  value={selectedToken.symbol}
                  onChange={(e) =>
                    setSelectedToken(
                      TOKENS.find((t) => t.symbol === e.target.value)!
                    )
                  }
                  disabled={anyLoading}
                >
                  {TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="right-group">
                <button
                  className="max"
                  onClick={() => setAmount(fromBalance)}
                  disabled={anyLoading}
                >
                  MAX
                </button>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={anyLoading}
                />
              </div>
            </div>
          </div>

          <div className="bridge-arrow">↓</div>

          <div className="bridge-section">
            <div className="bridge-row">
              <span>To</span>
              <span className="balance">
                Balance: <b>{parseFloat(toBalance).toFixed(2)}</b>{" "}
                {counterToken.symbol}
              </span>
            </div>
            <div className="bridge-chain">
              <img src={counterToken.logo} alt="" />
              <span>{counterToken.chainName}</span>
            </div>
            <div className="bridge-token readonly">
              <img src={counterToken.logo} alt="" />
              <span>{counterToken.symbol}</span>
            </div>
          </div>

          <button
            className={`bridge-continue ${!isAmountValid() ? "disabled" : ""}`}
            onClick={onContinue}
            disabled={!isAmountValid() || anyLoading}
          >
            {loadingAllowance && <span className="spinner" />}
            {loadingAllowance ? "Checking allowance…" : "Continue"}
          </button>
        </>
      )}

      {/* APPROVE */}
      {step === "approve" && (
        <>
          <h3>Approve Token</h3>
          <p>
            Approve <b>{selectedToken.symbol}</b> before bridging{" "}
            <b>{amount}</b> tokens.
          </p>
          <button
            className="bridge-continue"
            onClick={onApprove}
            disabled={anyLoading}
          >
            {loadingApprove && <span className="spinner" />}
            {loadingApprove ? "Approving…" : `Approve ${selectedToken.symbol}`}
          </button>
        </>
      )}

      {/* CONFIRM */}
      {step === "confirm" && (
        <>
          <h3>Confirm Bridge</h3>
          <div className="bridge-section">
            <div style={{ textAlign: "center", fontSize: "1.2rem" }}>
              <img src={selectedToken.logo} height={30} alt="" />{" "}
              <b>
                {amount} {selectedToken.symbol}
              </b>
            </div>
            <div className="bridge-chain" style={{ justifyContent: "center" }}>
              <img src={selectedToken.logo} height={20} alt="" />{" "}
              {selectedToken.chainName} →{" "}
              <img src={counterToken.logo} height={20} alt="" />{" "}
              {counterToken.chainName}
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: "0.9rem",
                marginTop: "1rem",
              }}
            >
              Estimated gas fee: <b>~0.000349 {selectedToken.symbol}</b>
            </div>
          </div>

          <button
            className="bridge-continue"
            onClick={onBridge}
            disabled={anyLoading}
          >
            {(signingBridge || submittingBridge) && (
              <span className="spinner" />
            )}
            {signingBridge
              ? "Waiting for signature…"
              : submittingBridge
              ? "Bridging (on-chain)…"
              : "Bridge Now"}
          </button>
        </>
      )}

      {/* DONE */}
      {step === "done" && txReceipt && (
        <div className="bridge-success p-4 text-center">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2">
            Bridged {parseFloat(amount).toFixed(4)} {selectedToken.symbol}
          </h3>
          <p className="text-sm mb-4">
            Tx Hash:{" "}
            <a
              href={`${import.meta.env.VITE_EXPLORER_BASE}/tx/${
                txReceipt.hash
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {txReceipt.hash.slice(0, 8)}…{txReceipt.hash.slice(-6)}
            </a>
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => (window.location.href = "/history")}
              className="bridge-continue"
              disabled={anyLoading}
            >
              View History
            </button>
            <button
              onClick={goBackToForm}
              className="bridge-continue"
              disabled={anyLoading}
            >
              Bridge Again
            </button>
          </div>
        </div>
      )}

      {/* BACK */}
      {step !== "form" && (
        <div className="mt-4 text-center">
          <button
            onClick={goBackToForm}
            className="back-button"
            disabled={anyLoading}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;

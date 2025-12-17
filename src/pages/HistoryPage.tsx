// src/pages/HistoryPage.tsx
import React, { useEffect, useState } from "react";
//import axios from "axios";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { type RootState } from "../store";
import { shortenAddress } from "../utils/formatAddress";
import { getDeposits, type Deposit } from "../apis/bridgeApi";
import { FiArrowRight } from "react-icons/fi";
import { useSelector } from "react-redux";
import { TOKENS } from "../constants/tokens";
import { FiExternalLink } from "react-icons/fi";

type Deposit = {
  orig_net: number;
  dest_net: number;
  orig_addr: string;
  amount: string;
  ready_for_claim: boolean;
  tx_hash: string;
  claim_tx_hash: string;
  global_index: string;
  block_num: number;
};

export default function HistoryPage() {
  // grab your connected address from Redux
  const navigate = useNavigate();
  const userAddr = useSelector((s: RootState) => s.bridge.address);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [selected, setSelected] = useState<Deposit | null>(null);

  // for fee lookups
  const [fee1, setFee1] = useState<string | null>(null);
  const [fee2, setFee2] = useState<string | null>(null);

  // 1) Fetch history on mount
  useEffect(() => {
    if (!userAddr) {
      setError("No wallet connected");
      setLoading(false);
      return;
    }
    async function loadHistory() {
      setLoading(true);
      try {
        const data = await getDeposits(userAddr, 100, 0);
        setDeposits(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [userAddr]);

  // 2) When user clicks an item, fetch its on-chain receipts to compute fees
  useEffect(() => {
    if (!selected) return;

    const fetchFee = async (txHash: string, net: number) => {
      const rpcUrl = TOKENS.find(
        (t) => t.chainId === (net === 0 ? 11155111 : 440044)
      )?.rpcUrl;
      if (!rpcUrl) return null;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const rec = await provider.getTransactionReceipt(txHash);
      const fee = rec.gasUsed.mul(rec.effectiveGasPrice);
      return ethers.formatEther(fee);
    };

    // step 1
    fetchFee(selected.tx_hash, selected.orig_net)
      .then(setFee1)
      .catch(() => setFee1(null));
    // step 2 if available
    if (selected.claim_tx_hash) {
      fetchFee(selected.claim_tx_hash, selected.dest_net)
        .then(setFee2)
        .catch(() => setFee2(null));
    } else {
      setFee2(null);
    }
  }, [selected]);

  if (loading) {
    return (
      <div className="history-spinner">
        <div className="spinner large" />
      </div>
    );
  }

  if (error) return <div className="history-container error">{error}</div>;

  // filtered list for tabs
  const list = deposits.filter((d) =>
    tab === "all" ? true : !d.ready_for_claim
  );

  // -- LIST VIEW --
  if (!selected) {
    return (
      <div className="history-container">
        <button className="history-page-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="history-title">Activity</h1>

        <div className="history-tabs">
          <button
            className={tab === "all" ? "active" : "tab"}
            onClick={() => setTab("all")}
          >
            All ({deposits.length})
          </button>
          <button
            className={tab === "pending" ? "active" : "tab"}
            onClick={() => setTab("pending")}
          >
            Pending ({deposits.filter((d) => !d.ready_for_claim).length})
          </button>
        </div>

        <div className="history-list">
          {list.map((d) => {
            // find token data for icon & symbol
            const token = TOKENS.find(
              (t) => t.address.toLowerCase() === d.orig_addr.toLowerCase()
            );
            const symbol = token?.symbol ?? "";
            const human = ethers.formatUnits(d.amount, token?.decimals ?? 18);
            return (
              <div
                key={d.global_index}
                className="history-item"
                onClick={() => setSelected(d)}
              >
                <div className="left">
                  <span className="icon">
                    <FiArrowRight />L{d.dest_net}
                  </span>
                  <div className="info">
                    <div className="title">Bridge to L{d.dest_net}</div>
                    <div
                      className={`badge ${
                        d.ready_for_claim ? "completed" : "pending"
                      }`}
                    >
                      {d.ready_for_claim ? "Completed" : "Pending"}
                    </div>
                  </div>
                </div>
                <div className="right">
                  <img src={token?.logo} alt={symbol} className="token-logo" />
                  <span className="amount">
                    {parseFloat(human).toFixed(4)} {symbol}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -- DETAILS VIEW --
  const {
    orig_net,
    dest_net,
    ready_for_claim,
    tx_hash,
    claim_tx_hash,
    amount,
  } = selected;
  const chainNames: Record<number, string> = {
    0: "Ethereum",
    1: "dexbros",
  };
  const token = TOKENS.find(
    (t) => t.address.toLowerCase() === selected.orig_addr.toLowerCase()
  );
  const symbol = token?.symbol ?? "";
  const human = parseFloat(
    ethers.formatUnits(amount, token?.decimals ?? 18)
  ).toFixed(4);

  return (
    <div className="history-container">
      <button className="history-back-button" onClick={() => setSelected(null)}>
        ← Back
      </button>

      <div className="details-amount">
        {human} {symbol}
      </div>

      <div className="details-grid">
        {/* Status */}
        <div className="details-label">Status</div>
        <div className="details-value">
          <span
            className={`status-dot ${
              ready_for_claim ? "completed" : "pending"
            }`}
          />
          {ready_for_claim ? "Completed" : "Pending"}
        </div>

        {/* From */}
        <div className="details-label">From</div>
        <div className="details-value">
          <img src="/tokens/eth.webp" alt="Ethereum" className="network-icon" />
          Ethereum
        </div>

        {/* To */}
        <div className="details-label">To</div>
        <div className="details-value">
          <img src="/tokens/dxz.png" alt="dexbros" className="network-icon" />
          dexbros
        </div>

        {/* Step 1 Fee */}
        <div className="details-label">Block</div>
        <div className="details-value">{selected?.block_num}</div>
      </div>

      {/* explorer buttons live in their own rows */}
      <div className="details-grid">
        <div className="details-label">Tx Hash</div>

        <div className="details-value">{shortenAddress(selected?.tx_hash)}</div>
      </div>

      {claim_tx_hash && (
        <>
          <div className="details-grid">
            <div className="details-label">
              Step 2 Fee ({chainNames[dest_net]})
            </div>
            <div className="details-value">
              {fee2 ? `${parseFloat(fee2).toFixed(6)} ETH` : "…loading"}
            </div>
          </div>

          <div className="details-grid">
            <div className="details-label">Track step 2 transaction</div>
            <a
              href={`${import.meta.env.VITE_EXPLORER_BASE}/tx/${claim_tx_hash}`}
              target="_blank"
              className="explorer-button"
              rel="noopener"
            >
              <FiExternalLink />
              View on explorer
            </a>
          </div>
        </>
      )}
    </div>
  );
}

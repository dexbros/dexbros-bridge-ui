// src/components/NetworkCard.tsx
import React, { useState } from "react";
import { NETWORK_DETAILS } from "../constants/networkDetails";
import { shortenAddress } from "../utils/formatAddress";
import { FiCopy, FiCheck } from "react-icons/fi";
import { useWallet } from "../hooks/useWallet";

const NetworkCard: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const {
    address,
    walletType,
    connected,
    connectMetaMask,
    connectDexbros,
    disconnectWallet,
  } = useWallet();

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1000);
  };

  const renderWalletButton = (
    type: "metamask" | "dexbros",
    label: string,
    icon: string,
    onConnect: () => void,
    disabledExtra = false
  ) => {
    const isActive = connected && walletType === type;
    const isDisabled = (connected && walletType !== type) || disabledExtra;

    return (
      <button
        className={`wallet-btn ${
          isActive ? "active" : isDisabled ? "disabled-btn" : ""
        }`}
        onClick={isActive ? disconnectWallet : onConnect}
        disabled={isDisabled}
        title={disabledExtra ? "Dexbros wallet loading…" : undefined}
      >
        <img src={icon} alt={label} className="inline-logo" />
        {isActive
          ? `Disconnect ${shortenAddress(address!)}`
          : `Connect ${label}`}
      </button>
    );
  };

  return (
    <div className="network-card-modern common-card">
      <div className="card-header">
        <h3>Bridge</h3>
        <span className="badge">L2 Chain Info</span>
      </div>

      <div className="card-list">
        {NETWORK_DETAILS.map((item, idx) => {
          const Icon = item.icon;
          const isContract = /contract|token/i.test(item.label);
          return (
            <div key={idx} className="card-row">
              <div className="label">
                <Icon /> {item.label}
              </div>
              <div className="value-block">
                {item.link ? (
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="value link"
                  >
                    {isContract ? shortenAddress(item.value) : item.value}
                  </a>
                ) : (
                  <span className="value">
                    {isContract ? shortenAddress(item.value) : item.value}
                  </span>
                )}
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(item.value)}
                  title="Copy"
                >
                  {copied === item.value ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="meta-buttons">
        {renderWalletButton(
          "metamask",
          "MetaMask",
          "/metamask.png",
          connectMetaMask
        )}
        {renderWalletButton(
          "dexbros",
          "Dexbros",
          "/tokens/dxz.png",
          connectDexbros
        )}
      </div>
    </div>
  );
};

export default NetworkCard;

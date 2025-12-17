# 🌉 Dexbros L2 Bridge UI

A production-ready **Layer 2 Bridge UI** for transferring assets between **Ethereum Sepolia (L1)** and **Dexbros L2**, supporting both **MetaMask** and the **Dexbros Wallet (iframe-based signing)**.

This repository contains the **frontend UI only**. It connects to deployed bridge smart contracts and backend RPC / indexer services.

---

## 🔗 Supported Networks

- L1: Ethereum Sepolia (chainId 11155111)
- L2: Dexbros Rollup (custom chain)
- Bridge Flow:
  - Sepolia → Dexbros L2
  - Dexbros L2 → Sepolia (via claim mechanism)

---

## ✨ Features

- ERC-20 token bridging
- MetaMask wallet integration
- Dexbros Wallet integration (secure iframe)
- Allowance check & approval flow
- On-chain bridge execution
- Transaction history & status tracking
- Gas fee calculation (L1 & L2)
- Persisted wallet session (Redux)

---

## 🧩 Architecture Overview

User  
→ MetaMask / Dexbros Wallet  
→ Bridge UI (React + TypeScript)  
→ Bridge Smart Contracts  
→ Bridge RPC / Indexer

---

## 🛠 Tech Stack

- React + TypeScript
- Vite
- Redux Toolkit + redux-persist
- ethers v6
- Axios
- SCSS
- iframe-based wallet communication

---

## 📦 Installation

yarn install  
yarn dev

---

## 🔐 Environment Variables

VITE_WALLET_ORIGIN=https://wallet.dexbros.com  
VITE_BRIDGE_ADDRESS=0x...  
VITE_BRIDGE_BASE_URL=https://api.dexbros.com  
VITE_L2_BRIDGE_RPC=https://rpc.dexbros.com  
VITE_L2_RPC=https://rpc.dexbros.com  
VITE_L2_CHAIN_ID=220070  
VITE_L2_EXPLORER=https://explorer.dexbros.com  
VITE_EXPLORER_BASE=https://sepolia.etherscan.io  
VITE_NATIVE_ERC20_TOKEN=0x...

---

## 🧠 Wallet Support

### MetaMask

- Uses EIP-1193 provider
- Direct contract interaction via ethers

### Dexbros Wallet

- Loaded via hidden iframe
- Secure postMessage signing flow
- Supports approval & bridge transactions
- Wallet UI opens only when required

---

## 📜 Smart Contract Interaction

Bridge function used:

bridgeAsset(
destinationNetwork,
destinationAddress,
amount,
token,
forceUpdateGlobalExitRoot,
permitData
)

---

## 📊 History & Status

- Fetches deposits from Bridge RPC
- Displays pending / completed status
- Shows L1 & L2 transaction hashes
- Displays gas fees and block numbers

---

## ⚠️ Notes

- Bridge contracts must already be deployed
- Claim execution may be automatic or external
- Sepolia is used for testing

---

## 🧪 Status

Beta / Testnet

---

## 📄 License

MIT

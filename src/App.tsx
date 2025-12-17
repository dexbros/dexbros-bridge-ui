// src/App.tsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import BridgePanel from "./components/BridgePanel";
import DexbrosWalletFrame from "./components/DexbrosWalletFrame";
import HistoryPage from "./pages/HistoryPage";
import "./styles/index.scss";

export default function App() {
  return (
    <div className="app-wrapper">
      <DexbrosWalletFrame />
      {/* route outlet */}
      <Routes>
        <Route path="/" element={<BridgePanel />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  );
}

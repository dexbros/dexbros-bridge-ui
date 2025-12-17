// src/constants/networkDetails.ts
import {
  FiExternalLink,
  FiCpu,
  FiLink,
  FiHash,
  FiDollarSign,
} from "react-icons/fi";

export const NETWORK_DETAILS = [
  {
    label: "RPC URL",
    value: import.meta.env.VITE_L2_RPC,
    icon: FiLink,
  },
  {
    label: "Chain ID",
    value: import.meta.env.VITE_L2_CHAIN_ID,
    icon: FiHash,
  },
  {
    label: "Currency",
    value: "DXZ",
    icon: FiDollarSign,
  },
  {
    label: "Block Explorer",
    value: import.meta.env.VITE_L2_EXPLORER,
    icon: FiExternalLink,
    link: true,
  },
  {
    label: "Rollup Contract",
    value: import.meta.env.VITE_ROLLUP_ADDRESS,
    icon: FiCpu,
    link: true,
  },
  {
    label: "Native Token (L1)",
    value: import.meta.env.VITE_NATIVE_ERC20_TOKEN,
    icon: FiCpu,
    link: true,
  },
];

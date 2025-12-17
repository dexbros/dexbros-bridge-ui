export type BridgeToken = {
  symbol: string;
  address: string;
  decimals: number;
  logo: string;
  counterSymbol: string;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  isNative: boolean;
};

export const TOKENS: BridgeToken[] = [
  {
    symbol: "dxzETH",
    address: import.meta.env.VITE_NATIVE_ERC20_TOKEN, //contract address
    decimals: 18,
    logo: "/tokens/eth.webp",
    counterSymbol: "DXZ",
    chainId: 11155111,
    chainName: "Ethereum (sepolia)",
    rpcUrl: `${import.meta.env.VITE_API_L1_RPC}`,
    isNative: false,
  },
  {
    symbol: "DXZ",
    address: "",
    decimals: 18,
    logo: "/tokens/dxz.png",
    counterSymbol: "dxzETH",
    chainId: import.meta.env.VITE_L2_CHAIN_ID,
    chainName: "dexbros (beta)",
    rpcUrl: import.meta.env.VITE_L2_RPC,
    isNative: true,
  },
];

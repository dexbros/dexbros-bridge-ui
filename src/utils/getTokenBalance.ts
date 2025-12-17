// utils/getTokenBalance.ts
import { ethers } from "ethers";
import type { BridgeToken } from "../constants/tokens";

/**
 * Fetches the user's token balance using the token's rpcUrl
 *
 * @param token BridgeToken - the token metadata
 * @param address string - the wallet address
 * @returns balance as formatted string
 */
export async function getTokenBalance(
  token: BridgeToken,
  address: string
): Promise<string> {
  if (!ethers.isAddress(address)) throw new Error("Invalid address");

  try {
    const provider = new ethers.JsonRpcProvider(token.rpcUrl);

    if (token.isNative) {
      const bal = await provider.getBalance(address);
      return ethers.formatEther(bal);
    } else {
      const erc20 = new ethers.Contract(
        token.address,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      const bal = await erc20.balanceOf(address);
      return ethers.formatUnits(bal, token.decimals);
    }
  } catch (err) {
    console.error(`Failed to fetch balance for ${token.symbol}:`, err);
    return "0.00";
  }
}

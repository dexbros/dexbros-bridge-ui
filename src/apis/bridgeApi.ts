// apis/bridgeApi.ts
import axios from "axios";

export const checkAllowance = async ({
  token,
  owner,
  spender,
  chainId,
}: {
  token: string;
  owner: string;
  spender: string;
  chainId: number;
}) => {
  try {
    const baseUrl = import.meta.env.VITE_BRIDGE_BASE_URL;
    console.log("baseUrl", baseUrl);
    const res = await axios.get(`${baseUrl}/token/allowance`, {
      params: { token, owner, spender, chainId },
    });
    return res.data.data;
  } catch (err: any) {
    console.error("Allowance API error:", err);
    throw new Error(err.response?.data?.error || "Allowance check failed");
  }
};

export async function getDeposits(
  userAddr: string,
  limit = 26,
  offset = 0
): Promise<any[]> {
  try {
    // build the exact URL you want
    const url =
      `${import.meta.env.VITE_L2_BRIDGE_RPC}/bridges/${userAddr}` +
      `?limit=${limit}&offset=${offset}`;

    const res = await axios.get<{ deposits: any[] }>(url);
    return res.data.deposits;
  } catch (err: any) {
    console.error("History API error:", err);
    throw new Error("Failed to load history");
  }
}

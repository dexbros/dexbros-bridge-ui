export interface BridgeRequest {
  amount: string;
  toAddress: string;
  originNetwork: number;
  destinationNetwork: number;
}

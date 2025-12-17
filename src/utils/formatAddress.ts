export function shortenAddress(address: string, chars = 6): string {
  return address.length > 2 * chars
    ? `${address.slice(0, chars)}...${address.slice(-chars)}`
    : address;
}

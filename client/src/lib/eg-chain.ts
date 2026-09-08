export interface EGBlock {
  index: number;
  timestamp: string;
  data: any;
  previousHash: string;
  hash: string;
}

export async function getChain(): Promise<EGBlock[]> {
  try {
    const res = await fetch('/chain.json');
    const chain = await res.json();
    return chain;
  } catch (e) {
    console.log('[EG-Chain] No chain yet');
    return [];
  }
}

export async function getLatestBlock() {
  const chain = await getChain();
  return chain[chain.length - 1];
}

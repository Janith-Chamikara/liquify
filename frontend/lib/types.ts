export type ResponseStatus = {
  status: "DEFAULT" | "SUCCESS" | "ERROR";
  message: string;
  data?: object;
};

export type Token = {
  id: string;
  mintAddress: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  supply: number;
  decimals: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  isListed: boolean;
  creatorWallet: string;
  createdAt: string;
};

export type LiquidityPool = {
  id: string;
  poolAddress: string;
  tokenAMint: string;
  tokenBMint: string;
  lpMintAddress: string;
  vaultAAddress: string;
  vaultBAddress: string;
  tokenAReserve: number;
  tokenBReserve: number;
  lpTotalSupply: number;
  creatorWallet: string;
  txSignature?: string;
  createdAt: string;
  tokenA: {
    name: string;
    symbol: string;
    imageUrl?: string;
    decimals: number;
  };
  tokenB: {
    name: string;
    symbol: string;
    imageUrl?: string;
    decimals: number;
  };
};

// Helper getters for backward compatibility
export const getPoolTokenASymbol = (pool: LiquidityPool) => pool.tokenA?.symbol;
export const getPoolTokenBSymbol = (pool: LiquidityPool) => pool.tokenB?.symbol;
export const getPoolTokenAName = (pool: LiquidityPool) => pool.tokenA?.name;
export const getPoolTokenBName = (pool: LiquidityPool) => pool.tokenB?.name;
export const getPoolTokenAImageUrl = (pool: LiquidityPool) =>
  pool.tokenA?.imageUrl;
export const getPoolTokenBImageUrl = (pool: LiquidityPool) =>
  pool.tokenB?.imageUrl;

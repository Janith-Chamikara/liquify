import { PublicKey } from "@solana/web3.js";

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

export type Transaction = {
  id: string;
  txSignature: string;
  txType: "swap" | "deposit" | "withdraw" | "create_token" | "create_pool";
  walletAddress: string;
  poolAddress?: string;
  // For swaps
  tokenInMint?: string;
  tokenOutMint?: string;
  tokenInSymbol?: string;
  tokenOutSymbol?: string;
  amountIn?: number;
  amountOut?: number;
  // For deposits/withdrawals
  tokenAAmount?: number;
  tokenBAmount?: number;
  lpAmount?: number;
  // For token creation
  tokenMint?: string;
  tokenName?: string;
  tokenSymbol?: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
};

export type TransactionsResponse = {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
};

export type PoolWithOnChainData = LiquidityPool & {
  onChainReserveA?: number;
  onChainReserveB?: number;
  onChainLpSupply?: number;
};

export type PoolAddresses = {
  pool: PublicKey;
  lpMint: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
};

export type InitializePoolResult = {
  signature: string;
  poolAddress: string;
  lpMintAddress: string;
  vaultAAddress: string;
  vaultBAddress: string;
};

export type DepositLiquidityResult = {
  signature: string;
  amountA: number;
  amountB: number;
};

export type SwapResult = {
  signature: string;
  amountIn: number;
  amountOut: number;
};

export type WithdrawLiquidityResult = {
  signature: string;
  lpAmount: number;
  amountA: number;
  amountB: number;
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

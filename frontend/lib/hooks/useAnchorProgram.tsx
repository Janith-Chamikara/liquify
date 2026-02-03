"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

// Smart contract program ID
const PROGRAM_ID = new PublicKey(
  "9NkKG55KStQNSdswjAt6tbQnNxTsLaBiExswWXXmcZw4",
);

// Token Metadata Program ID (Metaplex)
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

// Import the IDL JSON file
import idl from "@/lib/idl/smart_contract.json";

export interface PoolAddresses {
  pool: PublicKey;
  lpMint: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
}

export interface InitializePoolResult {
  signature: string;
  poolAddress: string;
  lpMintAddress: string;
  vaultAAddress: string;
  vaultBAddress: string;
}

export interface DepositLiquidityResult {
  signature: string;
  amountA: number;
  amountB: number;
}

export interface SwapResult {
  signature: string;
  amountIn: number;
  amountOut: number;
}

export const useAnchorProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return null;
    }
    return new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions(),
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as any, provider);
  }, [provider]);

  /**
   * Derive all PDA addresses for a liquidity pool
   */
  const derivePoolAddresses = async (
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
  ): Promise<PoolAddresses> => {
    // Pool PDA: seeds = ["pool", token_a_mint, token_b_mint]
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenAMint.toBuffer(), tokenBMint.toBuffer()],
      PROGRAM_ID,
    );

    // LP Mint PDA: seeds = ["lp", pool]
    const [lpMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), pool.toBuffer()],
      PROGRAM_ID,
    );

    // Vault A: ATA for pool with token_a_mint
    const vaultA = await getAssociatedTokenAddress(
      tokenAMint,
      pool,
      true, // allowOwnerOffCurve for PDAs
    );

    // Vault B: ATA for pool with token_b_mint
    const vaultB = await getAssociatedTokenAddress(tokenBMint, pool, true);

    return { pool, lpMint, vaultA, vaultB };
  };

  /**
   * Initialize a new liquidity pool
   */
  const initializePool = async (
    tokenAMint: string,
    tokenBMint: string,
    tokenASymbol: string,
    tokenBSymbol: string,
  ): Promise<InitializePoolResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const tokenAMintPubkey = new PublicKey(tokenAMint);
    const tokenBMintPubkey = new PublicKey(tokenBMint);

    const addresses = await derivePoolAddresses(
      tokenAMintPubkey,
      tokenBMintPubkey,
    );

    // Derive LP Metadata PDA
    const [lpMetadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        addresses.lpMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );

    const tx = await program.methods
      .initialize(tokenASymbol, tokenBSymbol)
      .accounts({
        creator: wallet.publicKey,
        tokenAMint: tokenAMintPubkey,
        tokenBMint: tokenBMintPubkey,
        pool: addresses.pool,
        lpMint: addresses.lpMint,
        vaultA: addresses.vaultA,
        vaultB: addresses.vaultB,
        lpMetadata: lpMetadata,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return {
      signature: tx,
      poolAddress: addresses.pool.toString(),
      lpMintAddress: addresses.lpMint.toString(),
      vaultAAddress: addresses.vaultA.toString(),
      vaultBAddress: addresses.vaultB.toString(),
    };
  };

  /**
   * Deposit initial liquidity into a pool
   */
  const depositLiquidity = async (
    tokenAMint: string,
    tokenBMint: string,
    amountA: number,
    amountB: number,
    decimalsA: number = 6,
    decimalsB: number = 6,
  ): Promise<DepositLiquidityResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const tokenAMintPubkey = new PublicKey(tokenAMint);
    const tokenBMintPubkey = new PublicKey(tokenBMint);

    const addresses = await derivePoolAddresses(
      tokenAMintPubkey,
      tokenBMintPubkey,
    );

    // Get user's token accounts
    const userA = await getAssociatedTokenAddress(
      tokenAMintPubkey,
      wallet.publicKey,
    );

    const userB = await getAssociatedTokenAddress(
      tokenBMintPubkey,
      wallet.publicKey,
    );

    // Get user's LP token account
    const userLp = await getAssociatedTokenAddress(
      addresses.lpMint,
      wallet.publicKey,
    );

    // Convert amounts to raw amounts (with decimals)
    const amountARaw = new BN(amountA * Math.pow(10, decimalsA));
    const amountBRaw = new BN(amountB * Math.pow(10, decimalsB));

    const tx = await program.methods
      .depositLiquidity(amountARaw, amountBRaw)
      .accounts({
        user: wallet.publicKey,
        pool: addresses.pool,
        vaultA: addresses.vaultA,
        vaultB: addresses.vaultB,
        lpMint: addresses.lpMint,
        userA,
        userB,
        userLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return { signature: tx, amountA, amountB };
  };

  /**
   * Get pool addresses without initializing
   */
  const getPoolAddresses = async (
    tokenAMint: string,
    tokenBMint: string,
  ): Promise<PoolAddresses> => {
    const tokenAMintPubkey = new PublicKey(tokenAMint);
    const tokenBMintPubkey = new PublicKey(tokenBMint);
    return derivePoolAddresses(tokenAMintPubkey, tokenBMintPubkey);
  };

  /**
   * Check if a pool exists
   */
  const poolExists = async (
    tokenAMint: string,
    tokenBMint: string,
  ): Promise<boolean> => {
    if (!program) return false;

    try {
      const addresses = await getPoolAddresses(tokenAMint, tokenBMint);
      const accountInfo = await connection.getAccountInfo(addresses.pool);
      return accountInfo !== null;
    } catch {
      return false;
    }
  };

  /**
   * Swap tokens in a pool
   * @param tokenAMint - Token A mint address
   * @param tokenBMint - Token B mint address
   * @param amountIn - Amount of input token to swap
   * @param minAmountOut - Minimum amount of output token to receive (slippage protection)
   * @param swapAToB - If true, swap token A for token B. If false, swap B for A.
   * @param decimalsIn - Decimals of input token
   */
  const swap = async (
    tokenAMint: string,
    tokenBMint: string,
    amountIn: number,
    minAmountOut: number,
    swapAToB: boolean = true,
    decimalsIn: number = 6,
    decimalsOut: number = 6,
  ): Promise<SwapResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const tokenAMintPubkey = new PublicKey(tokenAMint);
    const tokenBMintPubkey = new PublicKey(tokenBMint);

    const addresses = await derivePoolAddresses(
      tokenAMintPubkey,
      tokenBMintPubkey,
    );

    // Determine input/output based on swap direction
    const inputMint = swapAToB ? tokenAMintPubkey : tokenBMintPubkey;
    const outputMint = swapAToB ? tokenBMintPubkey : tokenAMintPubkey;
    const inputVault = swapAToB ? addresses.vaultA : addresses.vaultB;
    const outputVault = swapAToB ? addresses.vaultB : addresses.vaultA;

    // Get user's token accounts
    const userInput = await getAssociatedTokenAddress(
      inputMint,
      wallet.publicKey,
    );

    const userOutput = await getAssociatedTokenAddress(
      outputMint,
      wallet.publicKey,
    );

    // Convert amounts to raw amounts (with decimals)
    const amountInRaw = new BN(amountIn * Math.pow(10, decimalsIn));
    const minAmountOutRaw = new BN(minAmountOut * Math.pow(10, decimalsOut));

    const tx = await program.methods
      .swap(amountInRaw, minAmountOutRaw)
      .accounts({
        user: wallet.publicKey,
        pool: addresses.pool,
        vaultA: addresses.vaultA,
        vaultB: addresses.vaultB,
        inputVault,
        outputVault,
        userInput,
        userOutput,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return {
      signature: tx,
      amountIn,
      amountOut: minAmountOut,
    };
  };

  /**
   * Calculate expected output amount for a swap (using constant product formula)
   * @param reserveIn - Reserve of input token
   * @param reserveOut - Reserve of output token
   * @param amountIn - Amount of input token
   * @param feePercent - Fee percentage (default 0.3%)
   */
  const calculateSwapOutput = (
    reserveIn: number,
    reserveOut: number,
    amountIn: number,
    feePercent: number = 0.3,
  ): { amountOut: number; priceImpact: number; fee: number } => {
    if (reserveIn <= 0 || reserveOut <= 0 || amountIn <= 0) {
      return { amountOut: 0, priceImpact: 0, fee: 0 };
    }

    // Fee calculation
    const fee = (amountIn * feePercent) / 100;
    const amountInAfterFee = amountIn - fee;

    // Constant product formula: (x + dx) * (y - dy) = x * y
    // dy = y * dx / (x + dx)
    const amountOut =
      (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);

    // Price impact: how much the price changes due to this trade
    const spotPrice = reserveOut / reserveIn;
    const executionPrice = amountOut / amountIn;
    const priceImpact =
      Math.abs((spotPrice - executionPrice) / spotPrice) * 100;

    return { amountOut, priceImpact, fee };
  };

  return {
    program,
    provider,
    connected: !!wallet.publicKey && !!program,
    walletPublicKey: wallet.publicKey?.toString(),
    initializePool,
    depositLiquidity,
    getPoolAddresses,
    poolExists,
    derivePoolAddresses,
    swap,
    calculateSwapOutput,
  };
};

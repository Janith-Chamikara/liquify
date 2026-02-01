# 🏊 Mini DEX - Decentralized Exchange Smart Contract

A simple **Automated Market Maker (AMM)** like Uniswap, built on Solana using Anchor framework.

---

## 📖 What Does This Contract Do?

This is a **liquidity pool** smart contract that allows:

1. **Creating a Pool** - Set up a trading pair (e.g., USDC/SOL)
2. **Adding Liquidity** - Deposit tokens and receive LP tokens as proof
3. **Swapping** - Trade Token A for Token B (or vice versa)
4. **Removing Liquidity** - Burn LP tokens to get your share back

### Real-World Analogy 🏦

Imagine a **currency exchange booth** at an airport:

- The booth holds USD and EUR (the **liquidity pool**)
- People who funded the booth get **receipts** (LP tokens)
- Travelers can **swap** USD for EUR
- A small **fee (0.3%)** goes to the booth funders
- Receipt holders can **withdraw** their share anytime

---

## 🧠 Core Concepts

### What is a Liquidity Pool?

A pool is like a **shared piggy bank** where:

- Multiple people deposit tokens
- Anyone can trade against the pool
- Traders pay fees that go to depositors

### What is an LP Token?

LP = "Liquidity Provider" token. It's your **receipt** proving:

- How much you deposited
- Your % share of the pool
- Your right to withdraw + earned fees

### What is the Constant Product Formula?

```
x * y = k
```

- `x` = amount of Token A in pool
- `y` = amount of Token B in pool
- `k` = constant (stays the same after trades)

This formula automatically sets prices based on supply/demand!

---

## 🦀 Rust & Anchor Syntax Explained

### 1. Imports

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};
```

| Syntax                    | Meaning                                      |
| ------------------------- | -------------------------------------------- |
| `use`                     | Import modules (like `import` in JavaScript) |
| `anchor_lang::prelude::*` | Import all common Anchor items               |
| `anchor_spl::token`       | Import SPL Token program helpers             |
| `{self, Mint, Token...}`  | Import multiple items from same module       |

### 2. Program ID

```rust
declare_id!("nwjaWYz3F8AfkEemTVZJjCT3ZK9qHwai1W2EXBFgeQQ");
```

This is your program's **unique address** on Solana. Like a website's URL.

### 3. The #[program] Macro

```rust
#[program]
pub mod smart_contract {
    // Instructions go here
}
```

| Part             | Meaning                                          |
| ---------------- | ------------------------------------------------ |
| `#[program]`     | Anchor macro that marks this as the main program |
| `pub mod`        | Public module (container for functions)          |
| `smart_contract` | Module name                                      |

### 4. Function Signature

```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
```

| Part                       | Meaning                                      |
| -------------------------- | -------------------------------------------- |
| `pub fn`                   | Public function                              |
| `initialize`               | Function name (becomes the instruction name) |
| `ctx: Context<Initialize>` | Context containing all accounts              |
| `-> Result<()>`            | Returns Ok or Error (no value on success)    |

### 5. Accessing Accounts

```rust
let pool = &mut ctx.accounts.pool;
pool.token_a_mint = ctx.accounts.token_a_mint.key();
```

| Syntax              | Meaning                                    |
| ------------------- | ------------------------------------------ |
| `&mut`              | Mutable reference (we can modify it)       |
| `ctx.accounts.pool` | Access the `pool` account from context     |
| `.key()`            | Get the public key (address) of an account |

### 6. Account Validation Structs

```rust
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        seeds = [b"pool", token_a_mint.key().as_ref()],
        bump,
        space = 8 + 32 + 32 + 32 + 1
    )]
    pub pool: Account<'info, PoolState>,
}
```

| Attribute                   | Meaning                                 |
| --------------------------- | --------------------------------------- |
| `#[derive(Accounts)]`       | Auto-generate account validation code   |
| `<'info>`                   | Lifetime parameter (Rust memory safety) |
| `Signer<'info>`             | This account must sign the transaction  |
| `Account<'info, PoolState>` | Account containing PoolState data       |
| `#[account(mut)]`           | Account will be modified                |
| `#[account(init)]`          | Create this account                     |
| `payer = creator`           | Who pays for account creation           |
| `seeds = [...]`             | PDA seeds for deterministic address     |
| `bump`                      | Auto-find the PDA bump                  |
| `space = ...`               | How many bytes to allocate              |

### 7. PDA (Program Derived Address)

```rust
let seeds = &[
    b"pool",                        // Literal bytes
    pool.token_a_mint.as_ref(),     // Token A address
    pool.token_b_mint.as_ref(),     // Token B address
    &[pool.bump]                    // Bump seed
];
let signer = &[&seeds[..]];
```

PDAs are special addresses that:

- Are **derived** from seeds (deterministic)
- Can **only be signed by the program** (not a wallet)
- Perfect for program-owned accounts (vaults, pools)

### 8. Cross-Program Invocation (CPI)

```rust
let transfer_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    Transfer {
        from: ctx.accounts.user_a.to_account_info(),
        to: ctx.accounts.vault_a.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    }
);
token::transfer(transfer_ctx, amount_a)?;
```

CPI = Calling another program from your program.
Here we're calling the **Token Program** to transfer tokens.

| Part                              | Meaning                               |
| --------------------------------- | ------------------------------------- |
| `CpiContext::new()`               | Create context for cross-program call |
| `token_program.to_account_info()` | The program we're calling             |
| `Transfer { ... }`                | The accounts needed for transfer      |
| `token::transfer()`               | Execute the transfer                  |
| `?`                               | Propagate error if transfer fails     |

### 9. Data Storage

```rust
#[account]
pub struct PoolState {
    pub token_a_mint: Pubkey, // 32 bytes
    pub token_b_mint: Pubkey, // 32 bytes
    pub lp_mint: Pubkey,      // 32 bytes
    pub bump: u8,             // 1 byte
}
```

| Part          | Meaning                             |
| ------------- | ----------------------------------- |
| `#[account]`  | This struct will be stored on-chain |
| `Pubkey`      | 32-byte public key                  |
| `u8`          | Unsigned 8-bit integer (0-255)      |
| `// 32 bytes` | Size comment for space calculation  |

---

## 📋 Instructions Explained

### 1️⃣ Initialize Pool

**Purpose:** Create a new trading pool for two tokens.

**What happens:**

1. Creates a `PoolState` account (stores pool info)
2. Creates an `LP Mint` (for minting LP tokens)
3. Creates `Vault A` and `Vault B` (to hold deposited tokens)

```
┌─────────────────────────────────────────────────────────┐
│                    INITIALIZE                           │
├─────────────────────────────────────────────────────────┤
│  Creator pays rent for:                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  PoolState  │  │   LP Mint   │  │   Vaults    │     │
│  │  (97 bytes) │  │  (82 bytes) │  │  (A and B)  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

### 2️⃣ Deposit Liquidity

**Purpose:** Add tokens to the pool and receive LP tokens.

**What happens:**

1. User sends Token A + Token B to vaults
2. Program calculates LP tokens to mint
3. Program mints LP tokens to user

**Math for FIRST deposit:**

```
LP_tokens = √(amount_a × amount_b)
```

**Math for LATER deposits:**

```
LP_tokens = (deposit_amount / reserve) × total_supply
```

```
┌─────────────────────────────────────────────────────────┐
│                  DEPOSIT LIQUIDITY                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Wallet              Program Vaults                │
│  ┌──────────┐            ┌──────────┐                  │
│  │ 100 USDC │ ────────► │ Vault A  │                  │
│  │  10 SOL  │ ────────► │ Vault B  │                  │
│  └──────────┘            └──────────┘                  │
│                                                         │
│  User receives:  31.62 LP tokens (√(100 × 10))         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 3️⃣ Swap

**Purpose:** Trade one token for another.

**What happens:**

1. User sends input tokens to vault
2. Program calculates output using x\*y=k formula
3. Program sends output tokens to user
4. 0.3% fee stays in pool

**Math:**

```
amount_out = (reserve_out × amount_in × 0.997) / (reserve_in + amount_in × 0.997)
```

```
┌─────────────────────────────────────────────────────────┐
│                        SWAP                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Before: Pool has 100 USDC + 10 SOL (k = 1000)         │
│                                                         │
│  User sends: 10 USDC                                    │
│  User receives: ~0.906 SOL                              │
│  Fee kept: 0.03 USDC (0.3%)                            │
│                                                         │
│  After: Pool has 110 USDC + 9.094 SOL (k ≈ 1000)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 4️⃣ Withdraw Liquidity

**Purpose:** Burn LP tokens to get your share back.

**What happens:**

1. User sends LP tokens to be burned
2. Program calculates user's share of each token
3. Program sends tokens from vaults to user

**Math:**

```
amount_a = (lp_burned / total_supply) × reserve_a
amount_b = (lp_burned / total_supply) × reserve_b
```

```
┌─────────────────────────────────────────────────────────┐
│                  WITHDRAW LIQUIDITY                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User burns: 15.81 LP tokens (50% of supply)           │
│                                                         │
│  User receives:                                         │
│  ┌──────────┐            ┌──────────┐                  │
│  │ 55 USDC  │ ◄──────── │ Vault A  │                  │
│  │ 4.55 SOL │ ◄──────── │ Vault B  │                  │
│  └──────────┘            └──────────┘                  │
│                                                         │
│  (Includes earned fees!)                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Frontend Integration Examples

### Setup (TypeScript/JavaScript)

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { SmartContract } from "../target/types/smart_contract";

// Load the program
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.SmartContract as Program<SmartContract>;

// Your wallet
const wallet = provider.wallet;
```

---

### Example 1: Initialize Pool

```typescript
async function initializePool(tokenAMint: PublicKey, tokenBMint: PublicKey) {
  // 1. Derive PDA addresses
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), tokenAMint.toBuffer(), tokenBMint.toBuffer()],
    program.programId,
  );

  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), poolPda.toBuffer()],
    program.programId,
  );

  // 2. Get vault addresses (Associated Token Accounts)
  const vaultA = await getAssociatedTokenAddress(
    tokenAMint,
    poolPda,
    true, // allowOwnerOffCurve for PDAs
  );

  const vaultB = await getAssociatedTokenAddress(tokenBMint, poolPda, true);

  // 3. Send transaction
  const tx = await program.methods
    .initialize()
    .accounts({
      creator: wallet.publicKey,
      tokenAMint: tokenAMint,
      tokenBMint: tokenBMint,
      pool: poolPda,
      lpMint: lpMintPda,
      vaultA: vaultA,
      vaultB: vaultB,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("Pool initialized! TX:", tx);
  console.log("Pool address:", poolPda.toBase58());

  return { poolPda, lpMintPda, vaultA, vaultB };
}

// Usage
const tokenA = new PublicKey("USDC_MINT_ADDRESS_HERE");
const tokenB = new PublicKey("SOL_MINT_ADDRESS_HERE");
await initializePool(tokenA, tokenB);
```

---

### Example 2: Deposit Liquidity

```typescript
async function depositLiquidity(
  poolPda: PublicKey,
  amountA: number,
  amountB: number,
) {
  // 1. Fetch pool data to get mint addresses
  const poolData = await program.account.poolState.fetch(poolPda);

  // 2. Derive addresses
  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), poolPda.toBuffer()],
    program.programId,
  );

  const vaultA = await getAssociatedTokenAddress(
    poolData.tokenAMint,
    poolPda,
    true,
  );

  const vaultB = await getAssociatedTokenAddress(
    poolData.tokenBMint,
    poolPda,
    true,
  );

  // 3. Get user's token accounts
  const userTokenA = await getAssociatedTokenAddress(
    poolData.tokenAMint,
    wallet.publicKey,
  );

  const userTokenB = await getAssociatedTokenAddress(
    poolData.tokenBMint,
    wallet.publicKey,
  );

  const userLpToken = await getAssociatedTokenAddress(
    lpMintPda,
    wallet.publicKey,
  );

  // 4. Convert to smallest units (assuming 6 decimals)
  const amountALamports = amountA * 1_000_000;
  const amountBLamports = amountB * 1_000_000;

  // 5. Send transaction
  const tx = await program.methods
    .depositLiquidity(
      new anchor.BN(amountALamports),
      new anchor.BN(amountBLamports),
    )
    .accounts({
      user: wallet.publicKey,
      pool: poolPda,
      vaultA: vaultA,
      vaultB: vaultB,
      lpMint: lpMintPda,
      userA: userTokenA,
      userB: userTokenB,
      userLp: userLpToken,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log("Liquidity deposited! TX:", tx);
  return tx;
}

// Usage
await depositLiquidity(poolPda, 100, 10); // 100 Token A, 10 Token B
```

---

### Example 3: Swap Tokens

```typescript
async function swap(
  poolPda: PublicKey,
  amountIn: number,
  minAmountOut: number,
  swapAtoB: boolean, // true = A→B, false = B→A
) {
  // 1. Fetch pool data
  const poolData = await program.account.poolState.fetch(poolPda);

  // 2. Derive vault addresses
  const vaultA = await getAssociatedTokenAddress(
    poolData.tokenAMint,
    poolPda,
    true,
  );

  const vaultB = await getAssociatedTokenAddress(
    poolData.tokenBMint,
    poolPda,
    true,
  );

  // 3. Determine input/output based on swap direction
  const inputMint = swapAtoB ? poolData.tokenAMint : poolData.tokenBMint;
  const outputMint = swapAtoB ? poolData.tokenBMint : poolData.tokenAMint;
  const inputVault = swapAtoB ? vaultA : vaultB;
  const outputVault = swapAtoB ? vaultB : vaultA;

  // 4. Get user's token accounts
  const userInput = await getAssociatedTokenAddress(
    inputMint,
    wallet.publicKey,
  );

  const userOutput = await getAssociatedTokenAddress(
    outputMint,
    wallet.publicKey,
  );

  // 5. Convert to smallest units
  const amountInLamports = amountIn * 1_000_000;
  const minOutLamports = minAmountOut * 1_000_000;

  // 6. Send transaction
  const tx = await program.methods
    .swap(new anchor.BN(amountInLamports), new anchor.BN(minOutLamports))
    .accounts({
      user: wallet.publicKey,
      pool: poolPda,
      vaultA: vaultA,
      vaultB: vaultB,
      inputVault: inputVault,
      outputVault: outputVault,
      userInput: userInput,
      userOutput: userOutput,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("Swap complete! TX:", tx);
  return tx;
}

// Usage: Swap 10 Token A for Token B (minimum 0.9 Token B)
await swap(poolPda, 10, 0.9, true);
```

---

### Example 4: Withdraw Liquidity

```typescript
async function withdrawLiquidity(poolPda: PublicKey, lpAmount: number) {
  // 1. Fetch pool data
  const poolData = await program.account.poolState.fetch(poolPda);

  // 2. Derive addresses
  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), poolPda.toBuffer()],
    program.programId,
  );

  const vaultA = await getAssociatedTokenAddress(
    poolData.tokenAMint,
    poolPda,
    true,
  );

  const vaultB = await getAssociatedTokenAddress(
    poolData.tokenBMint,
    poolPda,
    true,
  );

  // 3. Get user's token accounts
  const userTokenA = await getAssociatedTokenAddress(
    poolData.tokenAMint,
    wallet.publicKey,
  );

  const userTokenB = await getAssociatedTokenAddress(
    poolData.tokenBMint,
    wallet.publicKey,
  );

  const userLpToken = await getAssociatedTokenAddress(
    lpMintPda,
    wallet.publicKey,
  );

  // 4. Convert to smallest units
  const lpLamports = lpAmount * 1_000_000;

  // 5. Send transaction
  const tx = await program.methods
    .withdrawLiquidity(new anchor.BN(lpLamports))
    .accounts({
      user: wallet.publicKey,
      pool: poolPda,
      vaultA: vaultA,
      vaultB: vaultB,
      lpMint: lpMintPda,
      userA: userTokenA,
      userB: userTokenB,
      userLp: userLpToken,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("Liquidity withdrawn! TX:", tx);
  return tx;
}

// Usage: Withdraw 15 LP tokens
await withdrawLiquidity(poolPda, 15);
```

---

### Helper: Get Pool Info

```typescript
async function getPoolInfo(poolPda: PublicKey) {
  // Fetch pool state
  const poolData = await program.account.poolState.fetch(poolPda);

  // Get vault balances
  const vaultA = await getAssociatedTokenAddress(
    poolData.tokenAMint,
    poolPda,
    true,
  );
  const vaultB = await getAssociatedTokenAddress(
    poolData.tokenBMint,
    poolPda,
    true,
  );

  const vaultAInfo = await provider.connection.getTokenAccountBalance(vaultA);
  const vaultBInfo = await provider.connection.getTokenAccountBalance(vaultB);

  // Get LP supply
  const [lpMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), poolPda.toBuffer()],
    program.programId,
  );
  const lpMintInfo = await provider.connection.getTokenSupply(lpMintPda);

  return {
    tokenAMint: poolData.tokenAMint.toBase58(),
    tokenBMint: poolData.tokenBMint.toBase58(),
    reserveA: vaultAInfo.value.uiAmount,
    reserveB: vaultBInfo.value.uiAmount,
    lpSupply: lpMintInfo.value.uiAmount,
    price: vaultAInfo.value.uiAmount / vaultBInfo.value.uiAmount,
  };
}

// Usage
const info = await getPoolInfo(poolPda);
console.log("Pool Info:", info);
// Output: { reserveA: 100, reserveB: 10, lpSupply: 31.62, price: 10 }
```

---

### Helper: Calculate Swap Output

```typescript
function calculateSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feePercent: number = 0.3,
): number {
  // Apply fee
  const amountInWithFee = amountIn * (1 - feePercent / 100);

  // Constant product formula
  const numerator = reserveOut * amountInWithFee;
  const denominator = reserveIn + amountInWithFee;

  return numerator / denominator;
}

// Usage
const outputAmount = calculateSwapOutput(10, 100, 10);
console.log(`Swapping 10 Token A gets you ${outputAmount.toFixed(4)} Token B`);
// Output: Swapping 10 Token A gets you 0.9063 Token B
```

---

## 🧪 Testing Locally

```bash
# 1. Start local validator
solana-test-validator

# 2. Build the program
anchor build

# 3. Deploy to localnet
anchor deploy

# 4. Run tests
anchor test
```

---

## 📁 Project Structure

```
smart_contract/
├── programs/
│   └── smart_contract/
│       ├── src/
│       │   └── lib.rs          # Main program logic
│       └── Cargo.toml          # Rust dependencies
├── tests/
│   └── smart_contract.ts       # Integration tests
├── target/
│   ├── idl/
│   │   └── smart_contract.json # Auto-generated IDL
│   └── types/
│       └── smart_contract.ts   # TypeScript types
├── Anchor.toml                 # Anchor config
└── package.json                # JS dependencies
```

---

## 🔑 Key Addresses (Localnet)

| Item                     | Address                                        |
| ------------------------ | ---------------------------------------------- |
| Program ID               | `nwjaWYz3F8AfkEemTVZJjCT3ZK9qHwai1W2EXBFgeQQ`  |
| Token Program            | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`  |
| Associated Token Program | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` |
| System Program           | `11111111111111111111111111111111`             |

---

## 🚨 Security Considerations

1. **Slippage Protection**: Always set a reasonable `min_amount_out` for swaps
2. **Re-initialization**: Pool can only be created once per token pair
3. **PDA Authority**: Only the program can sign for vault transfers
4. **Integer Overflow**: Using `checked_mul` and `checked_div` prevents overflow

---

## 📚 Learn More

- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Docs](https://spl.solana.com/token)
- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf) (AMM concept)

---

## 📝 License

MIT

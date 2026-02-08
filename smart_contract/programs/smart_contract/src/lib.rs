use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    CreateMetadataAccountsV3,
    Metadata,
    mpl_token_metadata::types::DataV2,
};

declare_id!("9NkKG55KStQNSdswjAt6tbQnNxTsLaBiExswWXXmcZw4");

/// Integer square root using Newton's method
fn integer_sqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[program]
pub mod smart_contract {
    use super::*;

    // INSTRUCTION 1: INITIALIZE POOL
    // Creates the Vaults, the LP Mint, and the Pool State account.
    pub fn initialize(
        ctx: Context<Initialize>,
        token_a_symbol: String,
        token_b_symbol: String,
    ) -> Result<()> {
        // Store the mint keys and bump for later use
        let token_a_mint = ctx.accounts.token_a_mint.key();
        let token_b_mint = ctx.accounts.token_b_mint.key();
        let lp_mint_key = ctx.accounts.lp_mint.key();
        let bump = ctx.bumps.pool;

        // Initialize pool state
        let pool = &mut ctx.accounts.pool;
        pool.token_a_mint = token_a_mint;
        pool.token_b_mint = token_b_mint;
        pool.lp_mint = lp_mint_key;
        pool.bump = bump;

        // Create LP Token Metadata
        let lp_name = format!("Liquify {} / {} LP", token_a_symbol, token_b_symbol);
        let sym_a: String = token_a_symbol.chars().take(4).collect();
        let sym_b: String = token_b_symbol.chars().take(4).collect();
        let lp_symbol = format!("{}{}-LP", sym_a, sym_b);
        
        // Seeds for PDA signing (use stored values to avoid borrow issues)
        let seeds = &[
            b"pool".as_ref(),
            token_a_mint.as_ref(),
            token_b_mint.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Create metadata for LP token
        let data_v2 = DataV2 {
            name: lp_name.clone(),
            symbol: lp_symbol,
            uri: String::from("https://igloo.exchange/lp-token-metadata.json"),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.lp_metadata.to_account_info(),
                mint: ctx.accounts.lp_mint.to_account_info(),
                mint_authority: ctx.accounts.pool.to_account_info(),
                update_authority: ctx.accounts.pool.to_account_info(),
                payer: ctx.accounts.creator.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signer_seeds,
        );

        create_metadata_accounts_v3(cpi_ctx, data_v2, true, true, None)?;

        msg!("Pool Initialized! LP Mint: {} with metadata: {}", lp_mint_key, lp_name);
        Ok(())
    }

    // INSTRUCTION 2: DEPOSIT LIQUIDITY (ADD FUNDS)
    // User deposits A + B -> Program calculates math -> Program mints LP Tokens
    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>, 
        amount_a: u64, 
        amount_b: u64
    ) -> Result<()> {
        
        // A. MATH: Calculate how many LP tokens to mint
        let pool = &ctx.accounts.pool;
        let lp_supply = ctx.accounts.lp_mint.supply;
        let reserve_a = ctx.accounts.vault_a.amount;
        let reserve_b = ctx.accounts.vault_b.amount;

        let liquidity_to_mint;
        
        if lp_supply == 0 {
            // Scenario 1: First depositor (Grand Opening)
            // Geometric Mean: sqrt(a * b) ensures 50/50 value ratio
            let product = (amount_a as u128) * (amount_b as u128);
            liquidity_to_mint = integer_sqrt(product) as u64;
            msg!("First Deposit! Minting {} LP", liquidity_to_mint);
        } else {
            // Scenario 2: Subsequent depositors
            // Must match current ratio: (Deposit / Reserve) * TotalSupply
            let share_a = (amount_a as u128)
                .checked_mul(lp_supply as u128).unwrap()
                .checked_div(reserve_a as u128).unwrap();
            
            
            liquidity_to_mint = share_a as u64;
            msg!("Adding Liquidity! Minting {} LP", liquidity_to_mint);
        }

        // B. TRANSFER FUNDS: User -> Vaults
        // 1. Transfer Token A
        let transfer_a_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_a.to_account_info(),
                to: ctx.accounts.vault_a.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        );
        token::transfer(transfer_a_ctx, amount_a)?;

        // 2. Transfer Token B
        let transfer_b_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_b.to_account_info(),
                to: ctx.accounts.vault_b.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        );
        token::transfer(transfer_b_ctx, amount_b)?;

        // C. MINT LP TOKENS: Program -> User
        // The Pool PDA ("pool") owns the Mint, so it must sign.
        let seeds = &[
            b"pool", 
            pool.token_a_mint.as_ref(), 
            pool.token_b_mint.as_ref(), 
            &[pool.bump]
        ];
        let signer = &[&seeds[..]];

        let mint_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer
        );
        token::mint_to(mint_ctx, liquidity_to_mint)?;

        Ok(())
    }

    // INSTRUCTION 3: SWAP (TRADE)
    // User sends In -> Math calculates Out -> Program sends Out
    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
        let pool = &ctx.accounts.pool;

        // 1. Determine Direction (A->B or B->A) based on input vault
        let is_a_to_b = ctx.accounts.input_vault.key() == ctx.accounts.vault_a.key();
        
        // 2. Load Reserves
        let reserve_in = ctx.accounts.input_vault.amount;
        let reserve_out = ctx.accounts.output_vault.amount;

        // 3. Constant Product Math: x * y = k
        // New In Balance = Old In + Amount In
        // New Out Balance = (Old In * Old Out) / New In Balance
        // Amount Out = Old Out - New Out Balance
        
        // Apply 0.3% Fee (Amount In * 997 / 1000)
        let amount_in_with_fee = (amount_in as u128) * 997;
        let numerator = (reserve_out as u128) * amount_in_with_fee;
        let denominator = (reserve_in as u128 * 1000) + amount_in_with_fee;
        
        let amount_out = (numerator / denominator) as u64;

        // 4. Slippage Check
        if amount_out < min_amount_out {
            return err!(DexError::SlippageExceeded);
        }

        // 5. Transfer Input (User -> Vault)
        let transfer_in_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_input.to_account_info(),
                to: ctx.accounts.input_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        );
        token::transfer(transfer_in_ctx, amount_in)?;

        // 6. Transfer Output (Vault -> User)
        let seeds = &[
            b"pool", 
            pool.token_a_mint.as_ref(), 
            pool.token_b_mint.as_ref(), 
            &[pool.bump]
        ];
        let signer = &[&seeds[..]];

        let transfer_out_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.output_vault.to_account_info(),
                to: ctx.accounts.user_output.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer
        );
        token::transfer(transfer_out_ctx, amount_out)?;

        msg!("Swapped {} In for {} Out", amount_in, amount_out);
        Ok(())
    }

    // INSTRUCTION 4: WITHDRAW LIQUIDITY (CLOSE POSITION)
    // User burns LP -> Program sends back % of A and B
    pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, lp_amount: u64) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let total_supply = ctx.accounts.lp_mint.supply;
        let reserve_a = ctx.accounts.vault_a.amount;
        let reserve_b = ctx.accounts.vault_b.amount;

        // 1. Calculate Fair Share
        // Amount = (LP Burned / Total LP) * Reserve
        let amount_a = (lp_amount as u128)
            .checked_mul(reserve_a as u128).unwrap()
            .checked_div(total_supply as u128).unwrap() as u64;

        let amount_b = (lp_amount as u128)
            .checked_mul(reserve_b as u128).unwrap()
            .checked_div(total_supply as u128).unwrap() as u64;

        // 2. Burn User's LP Tokens
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lp_mint.to_account_info(),
                from: ctx.accounts.user_lp.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        );
        token::burn(burn_ctx, lp_amount)?;

        // 3. Return Assets (Vault -> User)
        let seeds = &[
            b"pool", 
            pool.token_a_mint.as_ref(), 
            pool.token_b_mint.as_ref(), 
            &[pool.bump]
        ];
        let signer = &[&seeds[..]];

        // Return A
        let transfer_a_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_a.to_account_info(),
                to: ctx.accounts.user_a.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer
        );
        token::transfer(transfer_a_ctx, amount_a)?;

        let transfer_b_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_b.to_account_info(),
                to: ctx.accounts.user_b.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer
        );
        token::transfer(transfer_b_ctx, amount_b)?;

        msg!("Withdrew Liquidity: {} A, {} B", amount_a, amount_b);
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    // The two tokens we are creating a pool for
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,

    // 1. The Pool State PDA
    #[account(
        init,
        payer = creator,
        seeds = [b"pool", token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
        space = 8 + 32 + 32 + 32 + 1
    )]
    pub pool: Account<'info, PoolState>,

    // 2. The LP Mint (Owned by the Pool PDA)
    #[account(
        init,
        payer = creator,
        seeds = [b"lp", pool.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = pool,
    )]
    pub lp_mint: Account<'info, Mint>,

    // 3. The Vaults (Owned by the Pool PDA)
    #[account(
        init,
        payer = creator,
        associated_token::mint = token_a_mint,
        associated_token::authority = pool,
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = token_b_mint,
        associated_token::authority = pool,
    )]
    pub vault_b: Account<'info, TokenAccount>,

    /// CHECK: Created via CPI to token metadata program
    #[account(
        mut,
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            lp_mint.key().as_ref(),
        ],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub lp_metadata: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolState>,

    #[account(
        mut,
        associated_token::mint = pool.token_a_mint,
        associated_token::authority = pool
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.token_b_mint,
        associated_token::authority = pool
    )]
    pub vault_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"lp", pool.key().as_ref()],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    // User's Wallets
    #[account(mut)]
    pub user_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_b: Account<'info, TokenAccount>,
    
    // User's LP Wallet (Created if first time)
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = lp_mint,
        associated_token::authority = user
    )]
    pub user_lp: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolState>,

    // Vaults (We verify they belong to this pool)
    #[account(
        mut,
        associated_token::mint = pool.token_a_mint,
        associated_token::authority = pool
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.token_b_mint,
        associated_token::authority = pool
    )]
    pub vault_b: Account<'info, TokenAccount>,

    // Dynamic Input/Output
    #[account(mut)]
    pub input_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub output_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_input: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_output: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolState>,

    #[account(
        mut,
        associated_token::mint = pool.token_a_mint,
        associated_token::authority = pool
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.token_b_mint,
        associated_token::authority = pool
    )]
    pub vault_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"lp", pool.key().as_ref()],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_lp: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}


// DATA STATE
#[account]
pub struct PoolState {
    pub token_a_mint: Pubkey, // 32
    pub token_b_mint: Pubkey, // 32
    pub lp_mint: Pubkey,      // 32
    pub bump: u8,             // 1
}

#[error_code]
pub enum DexError {
    #[msg("Slippage Exceeded: The output amount is below your minimum.")]
    SlippageExceeded,
}
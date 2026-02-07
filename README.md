<img src="/frontend/public/logo-white.png">

A full-stack decentralized exchange (DEX) built on Solana, featuring token creation, liquidity pools, and token swaps using an Automated Market Maker (AMM) model.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## 🌟 Overview

Liquify DEX is a decentralized exchange that allows users to:

- **Create SPL Tokens** with metadata (name, symbol, image, social links)
- **Create Liquidity Pools** for any token pair
- **Swap Tokens** using the constant product AMM formula (x \* y = k)
- **Add/Remove Liquidity** and earn LP tokens
- **Track Transaction History** for all operations

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│     Backend     │     │  Smart Contract │
│   (Next.js)     │     │    (NestJS)     │     │    (Anchor)     │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │                 │              │
         │              │    Database     │              │
         │              │    (SQLite)     │              │
         │              │                 │              │
         │              └─────────────────┘              │
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │                         │
                    │    Solana Blockchain    │
                    │        (Devnet)         │
                    │                         │
                    └─────────────────────────┘
```

## ✨ Features

| Feature                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| 🪙 **Token Creation**      | Create SPL tokens with metadata using Metaplex |
| 💧 **Liquidity Pools**     | Create and manage AMM liquidity pools          |
| 🔄 **Token Swaps**         | Swap tokens with slippage protection           |
| 📊 **Price Charts**        | Real-time price history visualization          |
| 📜 **Transaction History** | Track all swaps, deposits, and withdrawals     |
| 🔐 **Wallet Integration**  | Connect with Phantom, Solflare, and more       |
| 🌙 **Dark Mode**           | Full dark/light theme support                  |

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** TanStack Query
- **Authentication:** Clerk
- **Wallet:** Solana Wallet Adapter
- **Charts:** Recharts

### Backend

- **Framework:** NestJS 11
- **Database:** SQLite with Prisma ORM
- **Authentication:** Clerk JWT verification
- **Validation:** class-validator

### Smart Contract

- **Framework:** Anchor 0.32
- **Language:** Rust
- **Network:** Solana Devnet
- **Token Standard:** SPL Token + Metaplex Metadata

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor CLI
- A Solana wallet with devnet SOL

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/liquify.git
   cd liquify
   ```

2. **Install dependencies**

   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install

   # Smart Contract
   cd ../smart_contract
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   # Frontend (.env.local)
   cp frontend/.env.example frontend/.env.local

   # Backend (.env)
   cp backend/.env.example backend/.env
   ```

4. **Set up the database**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Build and deploy the smart contract** (optional - already deployed on devnet)

   ```bash
   cd smart_contract
   anchor build
   anchor deploy
   ```

6. **Start the development servers**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

7. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
igloo/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # App router pages
│   │   ├── dashboard/        # Dashboard & explore pages
│   │   ├── onboarding/       # User onboarding flow
│   │   └── sign-in/          # Authentication pages
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── pool-card.tsx     # Pool display card
│   │   ├── swap-dialog.tsx   # Token swap interface
│   │   └── ...
│   ├── lib/                  # Utilities and hooks
│   │   ├── hooks/            # Custom React hooks
│   │   ├── actions.ts        # Server actions
│   │   └── types.ts          # TypeScript types
│   └── providers/            # Context providers
│
├── backend/                  # NestJS backend API
│   ├── src/
│   │   ├── auth/             # Authentication module
│   │   ├── token/            # Token management
│   │   ├── pool/             # Liquidity pool management
│   │   └── prisma/           # Database service
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── migrations/       # Database migrations
│
└── smart_contract/           # Anchor smart contract
    ├── programs/
    │   └── smart_contract/
    │       └── src/
    │           └── lib.rs    # Main contract code
    ├── tests/                # Contract tests
    └── target/
        └── idl/              # Generated IDL
```

## 📜 Smart Contract

**Program ID:** `9NkKG55KStQNSdswjAt6tbQnNxTsLaBiExswWXXmcZw4`

### Instructions

| Instruction          | Description                                    |
| -------------------- | ---------------------------------------------- |
| `initialize`         | Create a new liquidity pool with LP token mint |
| `deposit_liquidity`  | Add tokens to a pool and receive LP tokens     |
| `withdraw_liquidity` | Burn LP tokens and receive underlying tokens   |
| `swap`               | Exchange one token for another                 |

### AMM Formula

The contract uses the **constant product formula**:

```
x * y = k
```

Where:

- `x` = Reserve of Token A
- `y` = Reserve of Token B
- `k` = Constant product (invariant)

**Swap Fee:** 0.3% (30 basis points)

### LP Token Calculation

- **First deposit:** `LP = sqrt(amount_a * amount_b)`
- **Subsequent deposits:** `LP = (deposit_amount / reserve) * total_supply`

## 🔑 Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`backend/.env`)

```env
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL="file:./dev.db"
PORT=3001
```

## 📡 API Endpoints

### Tokens

| Method | Endpoint              | Description        |
| ------ | --------------------- | ------------------ |
| POST   | `/token/create`       | Create a new token |
| GET    | `/token/user/:wallet` | Get user's tokens  |
| GET    | `/token/get-all`      | Get all tokens     |

### Pools

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| POST   | `/pool/create`                 | Create a new pool           |
| GET    | `/pool/user/:wallet`           | Get user's pools            |
| GET    | `/pool/get-all`                | Get all pools               |
| POST   | `/pool/record-swap`            | Record a swap transaction   |
| POST   | `/pool/add-liquidity`          | Record liquidity addition   |
| POST   | `/pool/withdraw-liquidity`     | Record liquidity withdrawal |
| GET    | `/pool/:address/price-history` | Get price history           |

### Transactions

| Method | Endpoint                     | Description             |
| ------ | ---------------------------- | ----------------------- |
| POST   | `/pool/transaction`          | Record a transaction    |
| GET    | `/pool/transactions/:wallet` | Get user's transactions |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❄️ by Janith
</p>

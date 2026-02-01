import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export const useUmi = () => {
  const wallet = useWallet();

  // Define your RPC Endpoint (Replace with your QuickNode/Helius Devnet URL if you have one)
  // or use the public one: "https://api.devnet.solana.com"
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

  const umi = useMemo(() => {
    return createUmi(endpoint)
      .use(mplTokenMetadata())
      .use(walletAdapterIdentity(wallet))
      .use(
        irysUploader({
          address: "https://devnet.irys.xyz",
        }),
      );
  }, [wallet, endpoint]);

  return { umi };
};
// import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
// import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
// import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
// import { mockStorage } from "@metaplex-foundation/umi-storage-mock"; // <--- Import Mock Storage
// import { useWallet } from "@solana/wallet-adapter-react";
// import { useMemo } from "react";

// export const useUmi = () => {
//   const wallet = useWallet();

//   const endpoint = "http://127.0.0.1:8899";

//   const umi = useMemo(() => {
//     return (
//       createUmi(endpoint)
//         .use(mplTokenMetadata())
//         .use(walletAdapterIdentity(wallet))
//         // 2. Use Mock Storage (Fake uploads for local dev)
//         .use(mockStorage())
//     );
//   }, [wallet, endpoint]);

//   return { umi };
// };

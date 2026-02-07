import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export const useUmi = () => {
  const wallet = useWallet();

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

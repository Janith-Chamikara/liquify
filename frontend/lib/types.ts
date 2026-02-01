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

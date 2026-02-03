"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { CreateTokenFormValues, OnboardingFormValues } from "./schema";
import { isAxiosError } from "axios";
import api from "./axios";
import type { ResponseStatus } from "./types";

const getAuthToken = async () => {
  const { getToken } = await auth();
  return getToken ? await getToken() : null;
};

export const completeOnboarding = async (formData: OnboardingFormValues) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "No logged in user" };
  }

  const client = await clerkClient();

  try {
    await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
        walletAddress: formData.walletAddress,
      },
    });
    return { message: "Onboarding complete" };
  } catch (err) {
    console.error(err);
    return { error: "There was an error updating the user metadata." };
  }
};

export const createToken = async (formData: object) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "No logged in user" };
  }

  try {
    const token = await getAuthToken();
    console.log(token);
    const response = await api.post(
      "/token/create",
      {
        ...formData,
      },
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
    return {
      message: response.data.message,
      data: response.data,
      status: "SUCCESS",
    };
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const getTokens = async (walletAddress: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.get(`/token/user/${walletAddress}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      message: response.data.message,
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const createLiquidityPool = async (formData: object) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "No logged in user" };
  }

  try {
    const token = await getAuthToken();
    const response = await api.post(
      "/pool/create",
      {
        ...formData,
      },
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    );
    return {
      message: response.data.message,
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const getLiquidityPools = async (walletAddress: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.get(`/pool/user/${walletAddress}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      message: response.data.message,
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const getPriceHistory = async (
  poolAddress: string,
  timeRange: "1H" | "24H" | "7D" | "30D" | "ALL" = "24H",
) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.get(
      `/pool/${poolAddress}/price-history?range=${timeRange}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    return {
      message: "Price history fetched successfully",
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const recordSwap = async (data: {
  poolAddress: string;
  tokenAReserve: number;
  tokenBReserve: number;
  txSignature: string;
}) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.post("/pool/record-swap", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      message: "Swap recorded successfully",
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

// Public endpoints for explore page

export const getAllTokens = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.get("/token/get-all", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      message: "Tokens fetched successfully",
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const getAllPools = async () => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.get("/pool/get-all", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      message: "Pools fetched successfully",
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

export const addLiquidity = async (data: {
  poolAddress: string;
  amountA: number;
  amountB: number;
  newReserveA: number;
  newReserveB: number;
  txSignature: string;
}) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        status: "ERROR",
        message: "Please sign in first",
      } as ResponseStatus;
    }
    const token = await getAuthToken();
    const response = await api.post("/pool/add-liquidity", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return {
      message: "Liquidity added successfully",
      data: response.data,
      status: "SUCCESS",
    } as ResponseStatus;
  } catch (err) {
    console.log(err);
    if (isAxiosError(err)) {
      return {
        status: "ERROR",
        message: err.response?.data.message,
      } as ResponseStatus;
    }
  }
};

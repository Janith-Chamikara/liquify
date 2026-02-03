import * as z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const createTokenSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(32, "Name cannot exceed 32 characters"),

  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol cannot exceed 10 characters")
    .transform((val) => val.toUpperCase()),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  image: z
    .custom<File>((v) => v instanceof File, { message: "Image is required" })
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported.",
    ),

  supply: z.coerce
    .number()
    .int()
    .positive("Supply must be a positive number")
    .min(1, "Minimum supply is 1")
    .int("Supply must be a whole number"),

  decimals: z.coerce
    .number()
    .int()
    .min(0, "Decimals cannot be negative")
    .max(9, "Decimals cannot exceed 9")
    .default(6),

  website: z
    .string()
    .url("Please enter a valid URL (https://...)")
    .optional()
    .or(z.literal("")),

  twitter: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  telegram: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  discord: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type CreateTokenFormValues = z.infer<typeof createTokenSchema>;

export const onboardingSchema = z.object({
  walletAddress: z.string().min(32, "Please connect your wallet to continue."),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const createLiquidityPoolSchema = z
  .object({
    tokenAMint: z
      .string()
      .min(32, "Token A mint address is required")
      .max(44, "Invalid mint address"),
    tokenBMint: z
      .string()
      .min(32, "Token B mint address is required")
      .max(44, "Invalid mint address"),
    initialTokenAAmount: z
      .number()
      .positive("Amount must be positive")
      .min(0.000001, "Minimum amount is 0.000001"),
    initialTokenBAmount: z
      .number()
      .positive("Amount must be positive")
      .min(0.000001, "Minimum amount is 0.000001"),
  })
  .refine((data) => data.tokenAMint !== data.tokenBMint, {
    message: "Token A and Token B must be different",
    path: ["tokenBMint"],
  });

export type CreateLiquidityPoolFormValues = z.infer<
  typeof createLiquidityPoolSchema
>;

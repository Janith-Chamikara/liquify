"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, Globe, Twitter, Send, MessageCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createTokenSchema, type CreateTokenFormValues } from "@/lib/schema";
import { useUmi } from "@/lib/hooks/useUmi";
import { toast } from "sonner";
import {
  createGenericFile,
  generateSigner,
  percentAmount,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createFungible,
  mintV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { TokenCreationWarningDialog } from "@/components/token-warning";
import { createToken } from "@/lib/actions";

export default function CreateTokenDialog() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const { umi } = useUmi();

  const form = useForm({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      supply: 1000000,
      decimals: 6,
      website: "",
      twitter: "",
      telegram: "",
      discord: "",
    },
  });

  const onSubmit = async (data: CreateTokenFormValues) => {
    if (!umi) {
      toast.error("Wallet not connected. Please connect your wallet.");
      return;
    }

    const toastId = toast.loading("Starting token creation...");

    try {
      toast.message("Uploading token image...", { id: toastId });

      const fileBuffer = await data.image.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      const genericFile = createGenericFile(uint8Array, data.image.name, {
        contentType: data.image.type,
      });

      const [imageUri] = await umi.uploader.upload([genericFile]);
      console.log("Image uploaded:", imageUri);

      toast.message("Uploading token metadata...", { id: toastId });

      const metadata = {
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: imageUri,
        extensions: {
          website: data.website,
          twitter: data.twitter,
          telegram: data.telegram,
          discord: data.discord,
        },
      };

      const metadataUri = await umi.uploader.uploadJson(metadata);
      console.log("Metadata uploaded:", metadataUri);
      toast.message("Preparing token mint...", { id: toastId });

      const mintKeypair = generateSigner(umi);

      const supplyBigInt =
        BigInt(data.supply) * BigInt(10) ** BigInt(data.decimals);

      toast.message("Creating token on Solana...", { id: toastId });

      const tx = transactionBuilder()
        .add(
          createFungible(umi, {
            mint: mintKeypair,
            name: data.name,
            symbol: data.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(0),
            decimals: data.decimals,
          }),
        )
        .add(
          mintV1(umi, {
            mint: mintKeypair.publicKey,
            authority: umi.identity,
            amount: supplyBigInt,
            tokenOwner: umi.identity.publicKey,
            tokenStandard: TokenStandard.Fungible,
          }),
        );

      toast.message("Confirming transaction...", { id: toastId });

      const { signature } = await tx.sendAndConfirm(umi, {
        confirm: { commitment: "finalized" },
      });

      console.log("Token Created! Signature:", signature);

      const backendPayload = {
        mintAddress: mintKeypair.publicKey.toString(),
        creatorWallet: umi.identity.publicKey.toString(),
        name: data.name,
        symbol: data.symbol,
        imageUrl: imageUri,
        description: data.description || "",
        supply: data.supply,
        decimals: data.decimals,
        website: data.website || "",
        twitter: data.twitter || "",
        telegram: data.telegram || "",
        discord: data.discord || "",
      };

      const response = await createToken(backendPayload);

      console.log(response);

      if (response?.status === "SUCCESS") {
        toast.success("Token created successfully", {
          id: toastId,
          description: "Your token is now live on Solana.",
        });
      }

      form.reset();
      setPreview(null);
      setOpen(false);
    } catch (error) {
      console.error("Token creation failed:", error);

      toast.error("Failed to create token ❌", {
        id: toastId,
        description: "Check console logs for more details.",
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleCreateClick = () => {
    setShowWarning(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            onClick={handleCreateClick}
            size="lg"
            className="font-semibold shadow-md"
          >
            Create New Token
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Create Token</DialogTitle>
            <DialogDescription>
              Deploy your new token to the blockchain. Fill in the details
              below.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Token Identity
                  </h3>

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-6">
                            {preview ? (
                              <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border shadow-sm group">
                                <img
                                  src={preview}
                                  alt="Preview"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreview(null);
                                    form.setValue("image", undefined as any);
                                  }}
                                  className="absolute top-1 right-1 bg-black/50 hover:bg-destructive text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-24 h-24 shrink-0 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all">
                                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  Upload
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      onChange(file);
                                      setPreview(URL.createObjectURL(file));
                                    }
                                  }}
                                  {...rest}
                                />
                              </label>
                            )}
                            <div className="space-y-1">
                              <FormLabel className="text-base">
                                Token Icon
                              </FormLabel>
                              <FormDescription>
                                JPG, PNG or GIF. Max 5MB.
                                <br />
                                Recommended size: 500x500px.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Bitcoin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Symbol</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="BTC"
                              {...field}
                              className="uppercase"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What is your token about?"
                            className="resize-none h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Tokenomics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Supply</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value as string}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="decimals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decimals</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value as number}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Social Links (Optional)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Website URL"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Twitter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Twitter URL"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telegram"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Send className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Telegram URL"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discord"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <MessageCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Discord URL"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2 sticky bottom-0 bg-background pb-2">
                  <Button type="submit" className="w-full" size="lg">
                    Launch Token
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
      <TokenCreationWarningDialog
        open={showWarning}
        onOpenChange={setShowWarning}
      />
    </>
  );
}

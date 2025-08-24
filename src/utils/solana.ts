import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  Connection,
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import { ArxPredict } from "../contract/arx_predict";
// @ts-ignore
import * as IDL from "../contract/arx_predict.json";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getCompDefAccOffset,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
} from "@arcium-hq/client";

export const connection = new Connection(
  process.env["SOLANA_RPC_URL"] || "https://api.devnet.solana.com",
  "confirmed"
);
export const wallet = loadWalletFromEnv();
export const provider = new AnchorProvider(connection, new Wallet(wallet), {
  commitment: "confirmed",
});
export const program = new Program(IDL as any, provider) as Program<ArxPredict>;

export function loadWalletFromEnv() {
  const keyBase58 = process.env["WALLET_PRIVATE_KEY"];
  if (!keyBase58) throw new Error("Private key env var not found.");
  const secretKey = bs58.decode(keyBase58);
  const wallet = Keypair.fromSecretKey(secretKey);
  console.log("Wallet public key:", wallet.publicKey.toBase58());
  return wallet;
}

export async function requestAirdrop() {
  console.log("Requesting airdrop...");
  try {
    const signature = await connection.requestAirdrop(
      wallet.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    console.log(`Airdropped 1 SOL to ${wallet.publicKey.toBase58()}`);
    return signature;
  } catch (error) {
    console.error("Error requesting airdrop");
    return null;
  }
}

export async function getMarketData(marketId: number) {
  const marketDataSeed = [
    Buffer.from("market"),
    new BN(marketId).toArrayLike(Buffer, "le", 4),
  ];
  const marketDataPDA = PublicKey.findProgramAddressSync(
    marketDataSeed,
    program.programId
  )[0];
  const marketData = await program.account.marketAccount.fetch(marketDataPDA);
  return marketData;
}

export async function revealProbs(marketId: number) {
  try {
    console.log("Revealing probs for market", marketId);
    console.log("Wallet public key:", wallet.publicKey.toBase58());

    const clusterOffset = 1116522165;
    const clusterAccount = getClusterAccAddress(clusterOffset);
    const revealComputationOffset = new BN(randomBytes(8), "hex");
    const revealQueueSig = await program.methods
      .revealProbs(revealComputationOffset, marketId)
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          revealComputationOffset
        ),
        clusterAccount: clusterAccount,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("reveal_probs")).readUInt32LE()
        ),

        payer: wallet.publicKey,
      })
      .signers([wallet])
      .rpc({ commitment: "confirmed" });

    const revealFinalizeSig = await awaitComputationFinalization(
      provider,
      revealComputationOffset,
      program.programId,
      "confirmed"
    );

    return {
      revealQueueSig,
      revealFinalizeSig,
    };
  } catch (error) {
    console.error("Failed to reveal probs for market", marketId, error);
    const balance = await connection.getBalance(wallet.publicKey);
    console.log("Wallet balance:", balance / LAMPORTS_PER_SOL);
  }
  return null;
}

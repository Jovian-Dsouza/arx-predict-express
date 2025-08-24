import { AnchorProvider, BN, IdlEvents, Program, Wallet } from "@coral-xyz/anchor";
import { ArxPredict } from "../contract/arx_predict";
// @ts-ignore
import * as IDL from "../contract/arx_predict.json";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import Bull from "bull";
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
import { loadWalletFromEnv } from "../utils/solana";

type Event = IdlEvents<ArxPredict>;

const connection = new Connection(
  process.env["SOLANA_RPC_URL"] || "https://api.devnet.solana.com",
  "confirmed"
);
const wallet = Keypair.generate();
const provider = new AnchorProvider(connection, new Wallet(wallet), {
  commitment: "confirmed",
});
const program = new Program(IDL as any, provider) as Program<ArxPredict>;

export const eventNames: (keyof Event)[] = [
    "revealProbsEvent",
    "buySharesEvent",
    "sellSharesEvent",
    "initMarketStatsEvent",
    "marketSettledEvent",
];

export const solanaEventQueue = new Bull("solana-events", {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2 second delay
    },
  },
});

// Add error handling for the queue
solanaEventQueue.on('error', (error) => {
  console.error('❌ Solana event queue error:', error);
});

solanaEventQueue.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} failed:`, error);
});

solanaEventQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});


export class SolanaEventMonitor {
  private isRunning: boolean = false;
  private listeners: Map<string, any> = new Map();

  constructor() { }

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing Solana event monitor...");      
      console.log("Program ID:", program.programId.toBase58());
      console.log("✅ Solana event monitor initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Solana event monitor:", error);
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Monitor is already running");
      return;
    }

    console.log("🎧 Starting Solana program event monitoring...");
    this.isRunning = true;

    try {
      eventNames.forEach((eventName) => {
        this.listeners.set(eventName, program.addEventListener(
          eventName,
          async (event) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] 📡 ${eventName} event received, adding to queue...`);
            
            try {
              await solanaEventQueue.add({
                eventName,
                timestamp,
                data: event
              });
              console.log(`✅ ${eventName} event added to queue successfully`);
            } catch (error) {
              console.error(`❌ Failed to add ${eventName} event to queue:`, error);
            }
          }
        ));
        console.log(`✅ Listening for ${eventName} events`);
      });
    } catch (error) {
      console.error("❌ Failed to start monitoring:", error);
      this.isRunning = false;
      throw error;
    }
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) {
      console.log("⚠️ Monitor is not running");
      return;
    }

    console.log("🛑 Stopping Solana event monitoring...");

    try {
      // Clear all listeners
      this.listeners.clear();
      this.isRunning = false;

      console.log("✅ Solana event monitoring stopped");
    } catch (error) {
      console.error("❌ Error stopping monitoring:", error);
      throw error;
    }
  }

  getStatus(): { isRunning: boolean; listeners: string[] } {
    return {
      isRunning: this.isRunning,
      listeners: Array.from(this.listeners.keys()),
    };
  }
}


export async function getMarketData(
  marketId: number
) {
  const marketDataSeed = [
    Buffer.from("market"),
    new BN(marketId).toArrayLike(Buffer, "le", 4),
  ];
  const marketDataPDA = PublicKey.findProgramAddressSync(marketDataSeed, program.programId)[0];
  const marketData = await program.account.marketAccount.fetch(marketDataPDA);
  return marketData;
}

export async function revealProbs(
  marketId: number,
) {
  try {
    console.log("Revealing probs for market", marketId);
    const wallet = await loadWalletFromEnv();
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
    }
    
  } catch (error) {
    console.error("Failed to reveal probs for market", marketId, error);
  }
  return null;
}
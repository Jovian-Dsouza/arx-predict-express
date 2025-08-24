import { AnchorProvider, IdlEvents, Program, Wallet } from "@coral-xyz/anchor";
import { ArxPredict } from "../contract/arx_predict";
// @ts-ignore
import * as IDL from "../contract/arx_predict.json";
import { Connection, Keypair } from "@solana/web3.js";
import Bull from "bull";
type Event = IdlEvents<ArxPredict>;

const eventNames: (keyof Event)[] = [
    "voteEvent",
    "revealResultEvent",
    "revealProbsEvent",
    "buySharesEvent",
    "sellSharesEvent",
    "claimRewardsEvent",
    "initMarketStatsEvent",
    "claimMarketFundsEvent",
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
  private program: Program<ArxPredict> | null = null;

  constructor() {
    this.program = null;
  }

  async initialize(): Promise<void> {
    try {
      console.log("🔧 Initializing Solana event monitor...");

      const connection = new Connection(
        process.env["SOLANA_RPC_URL"] || "https://api.devnet.solana.com",
        "confirmed"
      );
      const wallet = Keypair.generate();
      const provider = new AnchorProvider(connection, new Wallet(wallet), {
        commitment: "confirmed",
      });
      this.program = new Program(IDL as any, provider) as Program<ArxPredict>;
      console.log("Program ID:", this.program.programId.toBase58());
      console.log("✅ Solana event monitor initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Solana event monitor:", error);
      throw error;
    }
  }

  async startMonitoring(): Promise<void> {
    if (!this.program) {
      console.error("❌ Program not initialized");
      return;
    }

    if (this.isRunning) {
      console.log("⚠️ Monitor is already running");
      return;
    }

    console.log("🎧 Starting Solana program event monitoring...");
    this.isRunning = true;

    try {
      eventNames.forEach((eventName) => {
        this.listeners.set(eventName, this.program?.addEventListener(
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

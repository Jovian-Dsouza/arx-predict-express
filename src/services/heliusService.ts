import axios from 'axios';
import { publishMessage } from '../config/ably';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.HELIUS_API_KEY) {
  throw new Error('HELIUS_API_KEY is required');
}

const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

export interface HeliusWebhookEvent {
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      updatedTokenBalance: string;
    }>;
  }>;
  description: string;
  events: any;
  fee: number;
  feePayer: string;
  instructions: Array<{
    accounts: string[];
    data: string;
    programId: string;
    innerInstructions: Array<{
      accounts: string[];
      data: string;
      programId: string;
    }>;
  }>;
  nativeTransfers: Array<{
    amount: number;
    fromUserAccount: string;
    toUserAccount: string;
  }>;
  signature: string;
  slot: number;
  timestamp: number;
  tokenTransfers: Array<{
    fromTokenAccount: string;
    fromUserAccount: string;
    mint: string;
    toTokenAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    tokenStandard: string;
  }>;
  transactionError: any;
  type: string;
}

export class HeliusService {
  // Process incoming webhook events
  static async processWebhookEvent(event: HeliusWebhookEvent): Promise<void> {
    try {
      // Process based on event type
      switch (event.type) {
        case 'NFT_MINT':
          await this.handleNFTMint(event);
          break;
        case 'NFT_SALE':
          await this.handleNFTSale(event);
          break;
        case 'TOKEN_MINT':
          await this.handleTokenMint(event);
          break;
        case 'TOKEN_SWAP':
          await this.handleTokenSwap(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Publish to Ably channel for real-time updates
      await publishMessage('helius-events', 'webhook-received', {
        type: event.type,
        signature: event.signature,
        timestamp: event.timestamp,
      });

    } catch (error) {
      console.error('Error processing Helius webhook:', error);
      throw error;
    }
  }

  // Handle NFT mint events
  private static async handleNFTMint(event: HeliusWebhookEvent): Promise<void> {
    console.log(`Processing NFT mint: ${event.signature}`);
    // Add your NFT mint logic here
  }

  // Handle NFT sale events
  private static async handleNFTSale(event: HeliusWebhookEvent): Promise<void> {
    console.log(`Processing NFT sale: ${event.signature}`);
    // Add your NFT sale logic here
  }

  // Handle token mint events
  private static async handleTokenMint(event: HeliusWebhookEvent): Promise<void> {
    console.log(`Processing token mint: ${event.signature}`);
    // Add your token mint logic here
  }

  // Handle token swap events
  private static async handleTokenSwap(event: HeliusWebhookEvent): Promise<void> {
    console.log(`Processing token swap: ${event.signature}`);
    // Add your token swap logic here
  }

  // Get transaction details from Helius
  static async getTransactionDetails(signature: string): Promise<any> {
    try {
      const response = await axios.get(
        `${HELIUS_BASE_URL}/transactions/?api-key=${HELIUS_API_KEY}`,
        {
          data: [signature],
        }
      );
      return response.data[0];
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  // Get account info from Helius
  static async getAccountInfo(account: string): Promise<any> {
    try {
      const response = await axios.get(
        `${HELIUS_BASE_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
        {
          data: [account],
        }
      );
      return response.data[0];
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }
}

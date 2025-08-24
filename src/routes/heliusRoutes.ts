import { Router, Request, Response } from 'express';
import { authenticateHeliusWebhook } from '../middleware/heliusAuth';

// Helius webhook event types
interface HeliusAccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: any[];
}

interface HeliusInstruction {
  accounts: string[];
  data: string;
  programId: string;
}

interface HeliusNativeTransfer {
  amount: number;
  fromUserAccount: string;
  toUserAccount: string;
}

interface HeliusTokenTransfer {
  amount: number;
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  tokenStandard: string;
}

interface HeliusWebhookEvent {
  accountData: HeliusAccountData[];
  description: string;
  events: Record<string, any>;
  fee: number;
  feePayer: string;
  instructions: HeliusInstruction[];
  nativeTransfers: HeliusNativeTransfer[];
  signature: string;
  slot: number;
  source: string;
  timestamp: number;
  tokenTransfers: HeliusTokenTransfer[];
  transactionError: any;
  type: string;
}

const router = Router();

router.post('/webhook', authenticateHeliusWebhook, (req: Request, res: Response) => {
  const webhookData = req.body as HeliusWebhookEvent[];
  console.log('Helius webhook received:', webhookData);
  
  // Log specific details for each transaction
//   webhookData.forEach((event: HeliusWebhookEvent, index: number) => {
//     console.log(`Transaction ${index + 1}:`);
//     console.log(`  Signature: ${event.signature}`);
//     console.log(`  Type: ${event.type}`);
//     console.log(`  Fee: ${event.fee} lamports`);
//     console.log(`  Slot: ${event.slot}`);
//     console.log(`  Timestamp: ${new Date(event.timestamp * 1000).toISOString()}`);
//     console.log(`  Fee Payer: ${event.feePayer}`);
//     console.log(`  Account Changes: ${event.accountData.length}`);
//     console.log(`  Instructions: ${event.instructions.length}`);
//     console.log(`  Native Transfers: ${event.nativeTransfers.length}`);
//     console.log(`  Token Transfers: ${event.tokenTransfers.length}`);
//     console.log(` Event: ${JSON.stringify(event.events, null, 2)}`);
//     console.log(` Account Data: ${JSON.stringify(event.accountData, null, 2)}`);
//     console.log(`instructions: ${JSON.stringify(event.instructions, null, 2)}`);
//     console.log('---');
//   });
  
  res.status(200).send('OK');
});

export default router;

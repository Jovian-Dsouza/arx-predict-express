import { Router, Request, Response } from 'express';
import { HeliusService, HeliusWebhookEvent } from '../services/heliusService';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = Router();

// Webhook endpoint for Helius
router.post(
  '/webhook',
  [
    body('*').notEmpty().withMessage('Webhook payload cannot be empty'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify webhook signature if secret is provided
      const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers['x-helius-signature'] as string;
        if (!signature) {
          return res.status(401).json({ error: 'Missing webhook signature' });
        }

        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');

        if (signature !== expectedSignature) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }

      // Process webhook event
      const webhookEvent = req.body as HeliusWebhookEvent;
      await HeliusService.processWebhookEvent(webhookEvent);

      return res.status(200).json({ 
        success: true, 
        message: 'Webhook processed successfully',
        signature: webhookEvent.signature 
      });

    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
);

// Get webhook events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query['limit'] as string) || 100;
    const events = await HeliusService.getWebhookEvents(limit);
    
    return res.json({
      success: true,
      data: events,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get transaction details
router.get('/transaction/:signature', async (req: Request, res: Response) => {
  try {
    const { signature } = req.params;
    
    if (!signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Signature parameter is required' 
      });
    }
    
    const transaction = await HeliusService.getTransactionDetails(signature);
    
    return res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get account info
router.get('/account/:account', async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    
    if (!account) {
      return res.status(400).json({ 
        success: false, 
        error: 'Account parameter is required' 
      });
    }
    
    const accountInfo = await HeliusService.getAccountInfo(account);
    
    return res.json({
      success: true,
      data: accountInfo
    });

  } catch (error) {
    console.error('Error fetching account info:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;

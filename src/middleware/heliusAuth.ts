import { Request, Response, NextFunction } from 'express';

// Helius webhook authentication middleware
export const authenticateHeliusWebhook = (req: Request, res: Response, next: NextFunction): void | Response => {
  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('HELIUS_WEBHOOK_SECRET environment variable is not set');
    return res.status(500).json({ 
      success: false, 
      error: 'Webhook authentication not configured' 
    });
  }

  const signature = req.headers['authorization'];
  
  if (!signature) {
    console.error('Missing authorization header in webhook request');
    return res.status(401).json({ 
      success: false, 
      error: 'Missing authorization header' 
    });
  }

  // Remove 'Bearer ' prefix if present
  const token = signature.startsWith('Bearer ') ? signature.slice(7) : signature;
  
  if (token !== webhookSecret) {
    console.error('Invalid webhook secret provided');
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid authorization token' 
    });
  }

  console.log('Helius webhook authenticated successfully');
  next();
};

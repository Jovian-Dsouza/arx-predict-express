import { Router, Request, Response } from 'express';
import { authenticateHeliusWebhook } from '../middleware/heliusAuth';

const router = Router();

router.post('/webhook', authenticateHeliusWebhook, (req: Request, res: Response) => {
  console.log('Helius webhook received:', req.body);
  res.status(200).send('OK');
});


export default router;

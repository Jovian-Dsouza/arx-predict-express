import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { 
  publishMessage, 
  getChannelHistory, 
  generateClientToken 
} from '../config/ably';

const router = Router();

// Get chat history for a channel
router.get('/history/:channel', async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const limit = parseInt(req.query['limit'] as string) || 100;

    if (!channel) {
      return res.status(400).json({ 
        success: false, 
        error: 'Channel parameter is required' 
      });
    }

    // Get messages from database
    const messages = await prisma.chatMessage.findMany({
      where: { channel },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Get recent messages from Ably
    const ablyMessages = await getChannelHistory(channel, limit);

    return res.json({
      success: true,
      data: {
        databaseMessages: messages,
        ablyMessages: ablyMessages,
      },
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Send a message to a channel
router.post(
  '/send',
  [
    body('content').notEmpty().withMessage('Message content is required'),
    body('channel').notEmpty().withMessage('Channel name is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, channel, userId } = req.body;

      if (!content || !channel || !userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Store message in database
      const message = await prisma.chatMessage.create({
        data: {
          content,
          channel,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Publish to Ably channel
      await publishMessage(channel, 'chat-message', {
        id: message.id,
        content: message.content,
        userId: message.userId,
        username: message.user.username,
        timestamp: message.timestamp,
      });

      return res.json({
        success: true,
        data: message,
        message: 'Message sent successfully',
      });

    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
);

// Get client token for Ably
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { clientId, channelName } = req.body;

    if (!clientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Client ID is required' 
      });
    }

    const token = await generateClientToken(clientId, channelName);

    return res.json({
      success: true,
      data: { token },
    });

  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get available channels
router.get('/channels', async (_req: Request, res: Response) => {
  try {
    const channels = await prisma.chatMessage.groupBy({
      by: ['channel'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return res.json({
      success: true,
      data: channels.map(channel => ({
        name: channel.channel,
        messageCount: channel._count.id,
      })),
    });

  } catch (error) {
    console.error('Error fetching channels:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get user's messages
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query['limit'] as string) || 50;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID parameter is required' 
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return res.json({
      success: true,
      data: messages,
    });

  } catch (error) {
    console.error('Error fetching user messages:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;

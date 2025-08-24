import Ably from 'ably';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ABLY_API_KEY) {
  throw new Error('ABLY_API_KEY is required');
}

// Ably Server SDK
export const ably = new Ably.Rest({
  key: process.env.ABLY_API_KEY,
});

// Ably Client SDK for server-side operations
export const ablyClient = new Ably.Realtime({
  key: process.env.ABLY_API_KEY,
});

// Channel management
export const getChannel = (channelName: string) => {
  return ably.channels.get(channelName);
};

// Publish message to a channel
export const publishMessage = async (
  channelName: string,
  eventName: string,
  data: any
): Promise<void> => {
  try {
    const channel = getChannel(channelName);
    await channel.publish(eventName, data);
  } catch (error) {
    console.error('Failed to publish message to Ably:', error);
    throw error;
  }
};

// Get channel history
export const getChannelHistory = async (
  channelName: string,
  limit: number = 100
): Promise<any[]> => {
  try {
    const channel = getChannel(channelName);
    const result = await channel.history({ limit });
    return result.items;
  } catch (error) {
    console.error('Failed to get channel history:', error);
    throw error;
  }
};

// Generate client token for frontend
export const generateClientToken = async (
  clientId: string,
  channelName?: string
): Promise<string> => {
  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: channelName
        ? { [channelName]: ['subscribe', 'publish'] }
        : { '*': ['subscribe', 'publish'] },
    });
    
    // For newer Ably versions, the token request contains the token directly
    if ('token' in tokenRequest && typeof tokenRequest.token === 'string') {
      return tokenRequest.token;
    } else {
      // Fallback: create a simple token request that the client can use
      // The client will need to handle the token request format
      return JSON.stringify(tokenRequest);
    }
  } catch (error) {
    console.error('Failed to generate client token:', error);
    throw error;
  }
};

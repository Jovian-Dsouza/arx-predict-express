import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
    },
  });

  console.log('✅ Users created:', { user1, user2 });

  // Create sample chat messages
  const message1 = await prisma.chatMessage.create({
    data: {
      content: 'Hello everyone! Welcome to the Arx Predict chat!',
      userId: user1.id,
      channel: 'general',
    },
  });

  const message2 = await prisma.chatMessage.create({
    data: {
      content: 'Thanks Alice! Excited to be here!',
      userId: user2.id,
      channel: 'general',
    },
  });

  console.log('✅ Chat messages created:', { message1, message2 });

  // Create sample predictions
  const prediction1 = await prisma.prediction.create({
    data: {
      title: 'Bitcoin to reach $100k by end of year',
      description: 'Based on current market trends and halving cycle',
      userId: user1.id,
    },
  });

  const prediction2 = await prisma.prediction.create({
    data: {
      title: 'Ethereum will outperform Bitcoin in Q4',
      description: 'Due to upcoming upgrades and DeFi growth',
      userId: user2.id,
    },
  });

  console.log('✅ Predictions created:', { prediction1, prediction2 });

  // Create sample Helius webhook events
  const webhook1 = await prisma.heliusWebhook.create({
    data: {
      eventType: 'NFT_MINT',
      payload: {
        signature: 'sample_signature_1',
        type: 'NFT_MINT',
        timestamp: Date.now(),
        description: 'Sample NFT mint event',
      },
      processed: true,
    },
  });

  const webhook2 = await prisma.heliusWebhook.create({
    data: {
      eventType: 'TOKEN_SWAP',
      payload: {
        signature: 'sample_signature_2',
        type: 'TOKEN_SWAP',
        timestamp: Date.now(),
        description: 'Sample token swap event',
      },
      processed: false,
    },
  });

  console.log('✅ Webhook events created:', { webhook1, webhook2 });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

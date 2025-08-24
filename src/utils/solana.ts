import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const wallet = new PublicKey('9CtkxgXqNF3yvGr4u9jdVByyZknBH4SoqPgNpRbX2sjP');

export async function requestAirdrop() {
    console.log('Requesting airdrop...');
    try {
        const signature = await connection.requestAirdrop(wallet, 1 * LAMPORTS_PER_SOL);
        console.log(`Airdropped 1 SOL to ${wallet.toBase58()}`);
        return signature;
    } catch (error) {
        console.error('Error requesting airdrop');
        return null;
    }
}

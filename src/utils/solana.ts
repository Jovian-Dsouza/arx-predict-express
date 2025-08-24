import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { Connection, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
export async function loadWalletFromEnv() {
    const keyBase58 = process.env['WALLET_PRIVATE_KEY'];
    if (!keyBase58) throw new Error("Private key env var not found.");
    const secretKey = bs58.decode(keyBase58);
    const wallet = Keypair.fromSecretKey(secretKey);
    console.log("Wallet public key:", wallet.publicKey.toBase58());
    return wallet;
}

export async function requestAirdrop() {
    console.log('Requesting airdrop...');
    const wallet = await loadWalletFromEnv();
    try {
        const signature = await connection.requestAirdrop(wallet.publicKey, 1 * LAMPORTS_PER_SOL);
        console.log(`Airdropped 1 SOL to ${wallet.publicKey.toBase58()}`);
        return signature;
    } catch (error) {
        console.error('Error requesting airdrop');
        return null;
    }
}

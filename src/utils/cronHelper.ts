import { prisma } from "../config/database";
import { revealProbs } from "./solana";

export async function findAllActiveMarketsNeedingReveal() {
    const oneMinuteAgo = new Date(Date.now() -  61 * 1000);
    
    const markets = await prisma.market.findMany({
        where: {
            status: "active",
            lastRevealProbsEventTimestamp: {
                lt: oneMinuteAgo
            }
        }
    })
    return markets;
}

export async function updateProbsForAllActiveMarkets() {
    const markets = await findAllActiveMarketsNeedingReveal();
    markets.forEach(async (market) => {
        console.log("Updating probs for market", market.id);
        await revealProbs(parseInt(market.id));
    })
}
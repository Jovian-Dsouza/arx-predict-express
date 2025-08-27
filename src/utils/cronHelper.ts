import { prisma } from "../config/database";
import { revealProbs } from "./solana";

// Find all active markets that need to be revealed
// lastRevealProbsEventTimestamp should be less than 1 minute ago
// Only update if there buy sell events in the last 1 minute
export async function findAllActiveMarketsNeedingReveal() {
    const oneMinuteAgo = new Date(Date.now() -  61 * 1000);
    const markets = await prisma.market.findMany({
        where: {
            status: "active",
            lastRevealProbsEventTimestamp: {
                lt: oneMinuteAgo
            },
            OR: [
                {
                    lastBuySharesEventTimestamp: {
                        gte: oneMinuteAgo
                    }
                },
                {
                    lastSellSharesEventTimestamp: {
                        gte: oneMinuteAgo
                    }
                }
            ]
        }
    })
    console.log("Markets needing reveal", markets.map(market => market.id));
    // const markets = await prisma.market.findMany({
    //     where: {
    //         lastRevealProbsEventTimestamp: {
    //             lt: oneMinuteAgo
    //         }
    //     }
    // })
    return markets;
}

export async function updateProbsForAllActiveMarkets() {
    const markets = await findAllActiveMarketsNeedingReveal();
    markets.forEach(async (market) => {
        console.log("Updating probs for market", market.id);
        await revealProbs(parseInt(market.id));
    })
}
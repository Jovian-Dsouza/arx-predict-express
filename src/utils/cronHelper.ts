import { prisma } from "../config/database";
import { revealProbs } from "./solana";

// Find all active markets that need to be revealed
// lastRevealProbsEventTimestamp should be less than 1 minute ago
// Only update if there buy sell events in the last 1 minute
export async function findAllActiveMarketsNeedingReveal() {
    const oneMinuteAgo = new Date(Date.now() -  60 * 1000);

    //TODO Debugging
    // const activeMarkets = await prisma.market.findMany({
    //     where: {
    //         status: "active"
    //     }
    // })
    // console.log("Active markets", activeMarkets.map(market => {
    //     return {
    //         id: market.id,
    //         lastRevealProbsEventTimestamp: market.lastRevealProbsEventTimestamp,
    //         lastBuySharesEventTimestamp: market.lastBuySharesEventTimestamp,
    //         lastSellSharesEventTimestamp: market.lastSellSharesEventTimestamp,
    //         oneMinuteAgo,
    //     }
    // }));

    const markets = await prisma.market.findMany({
        where: {
            status: "active",
            OR: [
                {
                    lastRevealProbsEventTimestamp: {
                        lt: oneMinuteAgo
                    }
                },
                {
                    lastRevealProbsEventTimestamp: null
                }
            ]
        }
    })

    const filteredMarkets = []

    for (const market of markets) {
        if (market.lastRevealProbsEventTimestamp === null) { // market has never been revealed
            console.log("Market has never been revealed", market.id);
            filteredMarkets.push(market);
        }
        else if (market.lastRevealProbsEventTimestamp < oneMinuteAgo) { // market has been revealed in the last minute
            console.log("Market has not been revealed in the last minute", market.id);
            if (market.lastBuySharesEventTimestamp !== null 
                && market.lastBuySharesEventTimestamp >= oneMinuteAgo) { // market has had buy shares event in the last minute
                console.log("Market has had buy shares event in the last minute", market.id);
                filteredMarkets.push(market);
            } else if (market.lastSellSharesEventTimestamp !== null
                && market.lastSellSharesEventTimestamp >= oneMinuteAgo) { // market has had sell shares event in the last minute
                console.log("Market has had sell shares event in the last minute", market.id);
                filteredMarkets.push(market);
            }
        }    
    }
    return filteredMarkets;
}

export async function updateProbsForAllActiveMarkets() {
    const markets = await findAllActiveMarketsNeedingReveal();
    markets.forEach(async (market) => {
        console.log("Updating probs for market", market.id);
        await revealProbs(parseInt(market.id));
    })
}
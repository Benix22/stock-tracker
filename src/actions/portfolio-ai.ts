"use server"

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBatchStockQuotes } from '@/actions/stock';

export type PortfolioAIResult = {
  summary: string;
  diversification: string;
  risk: string;
  opportunities: string;
}

export async function getPortfolioSummary(positions: { ticker: string, shares: number, avgPrice: number, currentPrice?: number }[]): Promise<PortfolioAIResult | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No GEMINI_API_KEY found in environment.");
            return null;
        }

        const genAI = new GoogleGenerativeAI(apiKey.trim());
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const tickers = positions.map(p => p.ticker);
        const quotes = await getBatchStockQuotes(tickers);

        const portfolioData = positions.map(p => {
            const q = quotes.find(quote => quote.symbol === p.ticker);
            const currentPrice = q?.price ?? p.currentPrice ?? 0;
            const value = p.shares * currentPrice;
            const cost = p.shares * p.avgPrice;
            const pnl = value - cost;
            const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
            
            return {
                ticker: p.ticker,
                shares: p.shares,
                currentPrice,
                value,
                pnlPct: pnlPct.toFixed(2) + '%'
            };
        });

        const totalValue = portfolioData.reduce((acc, curr) => acc + curr.value, 0);

        const prompt = `
            Act as a senior portfolio manager and financial advisor.
            Analyze the following investment portfolio of a retail user.
            
            Portfolio Composition:
            ${JSON.stringify(portfolioData, null, 2)}
            Total Portfolio Value: $${totalValue.toFixed(2)}
            
            Provide an executive summary of the portfolio. Focus on:
            1. General Performance: How is the portfolio doing overall?
            2. Diversification: Is it concentrated in one asset or industry (based on symbols)?
            3. Risk Profile: Is it high risk or conservative?
            4. Strategic Opportunities: What should the user consider next (buying more, rebalancing, sector rotation)?
            
            Output strictly in English.
            Return strictly a JSON object:
            {
              "summary": "Short executive summary",
              "diversification": "Analysis of the asset distribution",
              "risk": "Risk level assessment",
              "opportunities": "Strategic advice"
            }
        `;

        const result = await model.generateContent(prompt);
        const content = result.response.text().trim();
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("Portfolio AI: AI did not return a JSON object", content);
            return null;
        }
        
        const res: PortfolioAIResult = JSON.parse(jsonMatch[0]);
        return res;
    } catch (error: any) {
        console.error("Portfolio AI Error:", error.message);
        return null; 
    }
}

import { getBatchStockQuotes } from "@/actions/stock"
import { INDEX_CONSTITUENTS, INDICES_CONFIG } from "@/lib/constants"
import { IndexConstituentsTable } from "@/components/IndexConstituentsTable"
import { ArrowLeft, Share2, Download, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);
    const index = INDICES_CONFIG.find(i => i.symbol === decodedSymbol);
    
    return {
        title: `${index?.name || decodedSymbol} Real-Time | Stock Tracker`,
        description: `Real-time monitoring of all constituents of the ${index?.name || decodedSymbol} index.`,
    }
}

export default async function IndexPage({ params }: PageProps) {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);
    const index = INDICES_CONFIG.find(i => i.symbol === decodedSymbol);
    const constituents = INDEX_CONSTITUENTS[decodedSymbol];

    if (!constituents) {
        notFound();
    }

    const initialData = await getBatchStockQuotes(constituents);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded border border-blue-500/20 tracking-tighter uppercase">{index?.region}: {index?.name}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Live Updates (1s)</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                                {index?.name} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Market</span>
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mt-2 text-lg">
                                Real-time monitoring of the most influential companies in the {index?.region} market. 
                                High-frequency data tracking with millisecond precision.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-10 bg-background/50 border-border/50">
                            <Globe className="mr-2 h-4 w-4" />
                            Market Info
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 bg-background/50 border-border/50">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>

                {/* Table Section */}
                <IndexConstituentsTable 
                    symbol={decodedSymbol} 
                    indexName={index?.name || decodedSymbol} 
                    initialData={initialData} 
                />

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/50">
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Index Methodology</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This index tracks the performance of top companies in the {index?.region} region. 
                            The constituents are selected based on market capitalization, liquidity, and sector representation 
                            to provide an accurate benchmark of the overall market performance.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Live Data Stats</h4>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Data Source: Alpaca / Yahoo Real-time
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Region: {index?.region}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Precision: 1.0s Polling
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

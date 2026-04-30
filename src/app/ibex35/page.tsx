import { getBatchStockQuotes } from "@/actions/stock"
import { IBEX35_SYMBOLS } from "@/lib/constants"
import { Ibex35Table } from "@/components/Ibex35Table"
import { ArrowLeft, Share2, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: 'IBEX 35 Real-Time | Stock Tracker',
    description: 'Real-time monitoring of all 35 constituents of the Spanish IBEX 35 index.',
}

export default async function Ibex35Page() {
    const initialData = await getBatchStockQuotes(IBEX35_SYMBOLS)

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
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded border border-blue-500/20 tracking-tighter">BME: IBEX</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Live Updates</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                                IBEX 35 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Constituents</span>
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mt-2 text-lg">
                                Complete real-time tracking of the top 35 companies on the Spanish stock market. 
                                Updates every second with the latest exchange data.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-10 bg-background/50 border-border/50">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 bg-background/50 border-border/50">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Table Section */}
                <Ibex35Table initialData={initialData} />

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/50">
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider">About IBEX 35</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            The IBEX 35 is the benchmark stock market index of the Bolsa de Madrid, Spain's principal stock exchange. 
                            It is a market capitalization-weighted index comprising the 35 most liquid Spanish stocks traded in the Continuous Market.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wider">Market Information</h4>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-border" />
                                Trading Hours: 09:00 - 17:30 CET
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-border" />
                                Currency: Euro (EUR)
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-border" />
                                Update Frequency: 1.0s
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { PricingTable } from '@clerk/nextjs'
import { Navbar } from '@/components/Navbar'

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-background pt-24 pb-12">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-4">
                        Upgrade your Strategy
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic">
                        Unlock AI insights, real-time alerts, and advanced analytics to dominate the league.
                    </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                    <PricingTable />
                </div>

                <div className="mt-12 text-center text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-50">
                    Secure checkout powered by Stripe & Clerk Billing
                </div>
            </div>
        </main>
    )
}

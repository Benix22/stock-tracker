"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Brain, TrendingUp, ShieldCheck, Target, Sparkles, RefreshCw, Crown } from "lucide-react";
import { getBatchStockQuotes } from "@/actions/stock";
import { useAuth, UserButton } from "@clerk/nextjs";
import { getPositions, addOrUpdatePosition, deletePosition } from "@/actions/portfolio-db";
import { getPortfolioSummary } from "@/actions/portfolio-ai";
import { PortfolioCalendar } from "@/components/PortfolioCalendar";
import { getUserPlan } from "@/actions/subscription";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtCurrency = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtPct = (n) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const fmtNum = (n) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, positive, negative, neutral }) {
  const color = positive ? "text-emerald-500" : negative ? "text-rose-500" : "text-foreground";
  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5 flex flex-col gap-1 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function ChangeChip({ value, pct }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums
        ${up ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}
    >
      {up ? "▲" : "▼"}
      {fmtPct(Math.abs(pct))}
    </span>
  );
}

function AddPositionModal({ onAdd, onClose, existingTickers, loading: submitting }) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const t = ticker.trim().toUpperCase();
    const s = parseFloat(shares);
    const p = parseFloat(avgPrice);
    if (!t) return setError("Enter a ticker (e.g. AAPL)");
    if (!s || s <= 0) return setError("Invalid share count");
    if (!p || p <= 0) return setError("Invalid purchase price");

    try {
      await onAdd({ ticker: t, shares: s, avgPrice: p });
      onClose();
    } catch (e) {
      setError("Failed to add position. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <h3 className="mb-5 text-lg font-bold text-foreground">Add Position</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ticker
            </label>
            <input
              autoFocus
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="E.g. NVDA, AAPL, MSFT…"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={submitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Shares Count
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Purchase Price
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="150.00"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={submitting}
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const [positions, setPositions] = useState([]);
  const [quotes, setQuotes] = useState({}); // { [ticker]: Quote }
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState("value"); // "value" | "pl" | "plPct" | "ticker"
  
  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [userPlan, setUserPlan] = useState("FREE");

  // Fetch from DB
  const refreshHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const [data, plan] = await Promise.all([
        getPositions(),
        getUserPlan()
      ]);
      setPositions(data.map(p => ({ ...p, ticker: p.symbol })));
      setUserPlan(plan);
    } catch (e) {
      console.error("Failed to load portfolio data", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoaded && userId) {
      refreshHistory();
    }
  }, [authLoaded, userId, refreshHistory]);

  // Fetch quotes whenever positions change
  const refreshQuotes = useCallback(async () => {
    if (positions.length === 0) {
      setQuotesLoading(false);
      return;
    }
    setQuotesLoading(true);
    try {
      const tickers = [...new Set(positions.map((p) => p.ticker))];
      const results = await getBatchStockQuotes(tickers);
      const map = {};
      results.forEach((q) => {
        map[q.symbol] = {
          ticker: q.symbol,
          price: q.price,
          change: q.change,
          changePct: q.changePercent,
          currency: q.currency || "USD",
        };
      });
      setQuotes(map);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch quotes", err);
    } finally {
      setQuotesLoading(false);
    }
  }, [positions]);

  useEffect(() => {
    if (positions.length > 0) {
      refreshQuotes();
      const interval = setInterval(refreshQuotes, 60_000); // auto-refresh every minute
      return () => clearInterval(interval);
    }
  }, [refreshQuotes, positions.length]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAddPosition = async (pos) => {
    setActionLoading(true);
    try {
      await addOrUpdatePosition({ symbol: pos.ticker, shares: pos.shares, avgPrice: pos.avgPrice });
      await refreshHistory();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePosition = async (id) => {
    try {
      setPositions(prev => prev.filter(p => p.id !== id)); // Optimistic UI
      await deletePosition(id);
      setAiSummary(null); // Force refresh AI if portfolio changes
    } catch (e) {
      await refreshHistory(); // Rollback
    }
  };

  const generateAISummary = async () => {
    if (userPlan === "FREE") {
      return; // Handled by UI overlay
    }
    if (enriched.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await getPortfolioSummary(enriched);
      if (result) {
        setAiSummary(result);
      } else {
        setAiError("Could not generate analysis at this time.");
      }
    } catch (err) {
      setAiError("IA connection error.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Derived metrics ───────────────────────────────────────────────────────
  const enriched = positions.map((pos) => {
    const q = quotes[pos.ticker];
    const currentPrice = q?.price ?? null;
    const costBasis = pos.shares * pos.avgPrice;
    const currentValue = currentPrice != null ? pos.shares * currentPrice : null;
    const pl = currentValue != null ? currentValue - costBasis : null;
    const plPct = pl != null ? (pl / costBasis) * 100 : null;
    const dayChange = q ? pos.shares * q.change : null;
    return { ...pos, currentPrice, costBasis, currentValue, pl, plPct, dayChange, currency: q?.currency || "USD" };
  });

  const totalValue = enriched.reduce((s, p) => s + (p.currentValue ?? p.costBasis), 0);
  const totalCost = enriched.reduce((s, p) => s + p.costBasis, 0);
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const totalDayChange = enriched.reduce((s, p) => s + (p.dayChange ?? 0), 0);

  // Sort
  const sorted = [...enriched].sort((a, b) => {
    if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker);
    if (sortKey === "value") return (b.currentValue ?? 0) - (a.currentValue ?? 0);
    if (sortKey === "pl") return (b.pl ?? -Infinity) - (a.pl ?? -Infinity);
    if (sortKey === "plPct") return (b.plPct ?? -Infinity) - (a.plPct ?? -Infinity);
    return 0;
  });

  // Weight (for allocation bar)
  const maxValue = Math.max(...enriched.map((p) => p.currentValue ?? p.costBasis), 1);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Securing your portfolio...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {showModal && (
          <AddPositionModal
            onAdd={handleAddPosition}
            onClose={() => setShowModal(false)}
            existingTickers={positions.map((p) => p.ticker)}
            loading={actionLoading}
          />
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">My Portfolio</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lastUpdated
                    ? `Updated: ${lastUpdated.toLocaleTimeString("en-US")} · Auto-refresh every 60s`
                    : "Connecting to secure database…"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshQuotes}
                disabled={quotesLoading || positions.length === 0}
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={quotesLoading ? "animate-spin" : ""}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="M12 5v14" />
                </svg>
                Add Position
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {positions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total Value"
              value={fmtCurrency(totalValue)}
              sub={`Cost: ${fmtCurrency(totalCost)}`}
              neutral
            />
            <StatCard
              label="Total P&L"
              value={fmtCurrency(totalPL)}
              sub={fmtPct(totalPLPct)}
              positive={totalPL >= 0}
              negative={totalPL < 0}
            />
            <StatCard
              label="Day Change"
              value={fmtCurrency(totalDayChange)}
              sub="Daily Variation"
              positive={totalDayChange >= 0}
              negative={totalDayChange < 0}
            />
            <StatCard
              label="Positions"
              value={positions.length}
              sub="active assets"
              neutral
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && positions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Empty Portfolio</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add your first position to track your P&L in real-time.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              Add Position
            </button>
          </div>
        )}


        {/* Positions table */}
        {positions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[800px]">
              {[
                { key: "ticker", label: "Asset" },
                { key: null, label: "Price" },
                { key: null, label: "Position" },
                { key: "value", label: "Value" },
                { key: "pl", label: "P&L" },
                { key: "plPct", label: "%" },
              ].map(({ key, label }) => (
                <button
                  key={label}
                  onClick={() => key && setSortKey(key)}
                  className={`text-left transition ${key ? "hover:text-foreground cursor-pointer" : "cursor-default"} ${sortKey === key ? "text-primary" : ""}`}
                >
                  {label} {sortKey === key && "↓"}
                </button>
              ))}
              <span />
            </div>

            {/* Rows */}
            {sorted.map((pos) => {
              const pnlUp = (pos.pl ?? 0) >= 0;
              const dayUp = (pos.dayChange ?? 0) >= 0;
              const weight = ((pos.currentValue ?? pos.costBasis) / maxValue) * 100;

              return (
                <div
                  key={pos.id}
                  className="group relative grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b px-5 py-4 transition hover:bg-muted/50 last:border-0 min-w-[800px]"
                >
                  {/* Allocation bar */}
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/5 transition-all duration-500"
                    style={{ width: `${weight}%` }}
                  />

                  {/* Ticker */}
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                      {pos.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{pos.ticker}</div>
                      <div className="text-xs text-muted-foreground">{fmtNum(pos.shares)} shares</div>
                    </div>
                  </div>

                  {/* Current price */}
                  <div className="relative flex flex-col justify-center">
                    <div className="tabular-nums text-sm font-medium text-foreground">
                      {pos.currentPrice != null ? fmtCurrency(pos.currentPrice, pos.currency) : "—"}
                    </div>
                    {pos.dayChange != null && (
                      <div className={`text-xs tabular-nums ${dayUp ? "text-emerald-500" : "text-rose-500"}`}>
                        {dayUp ? "+" : ""}{fmtCurrency(pos.dayChange, pos.currency)} today
                      </div>
                    )}
                  </div>

                  {/* Cost basis */}
                  <div className="relative flex flex-col justify-center">
                    <div className="tabular-nums text-sm text-foreground">
                      {fmtCurrency(pos.avgPrice, pos.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">buying price</div>
                  </div>

                  {/* Market value */}
                  <div className="relative flex items-center">
                    <span className="tabular-nums text-sm font-semibold text-foreground">
                      {pos.currentValue != null ? fmtCurrency(pos.currentValue, pos.currency) : fmtCurrency(pos.costBasis, pos.currency)}
                    </span>
                  </div>

                  {/* P&L absolute */}
                  <div className="relative flex items-center">
                    <span className={`tabular-nums text-sm font-semibold ${pos.pl != null ? (pnlUp ? "text-emerald-500" : "text-rose-500") : "text-muted-foreground"}`}>
                      {pos.pl != null
                        ? `${pnlUp ? "+" : ""}${fmtCurrency(pos.pl, pos.currency)}`
                        : "—"}
                    </span>
                  </div>

                  {/* P&L % chip */}
                  <div className="relative flex items-center">
                    {pos.plPct != null ? (
                      <ChangeChip value={pos.pl} pct={pos.plPct} />
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>

                  {/* Delete */}
                  <div className="relative flex items-center">
                    <button
                      onClick={() => handleRemovePosition(pos.id)}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-100 md:opacity-0 transition hover:bg-destructive/10 hover:text-destructive md:group-hover:opacity-100"
                      title="Remove position"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Portfolio Calendar / Roadmap */}
        {positions.length > 0 && (
          <div className="mt-8">
            <PortfolioCalendar symbols={positions.map(p => p.ticker)} />
          </div>
        )}

        {/* Investment Co-pilot Section */}
        {positions.length > 0 && (
          <div className={`mt-16 space-y-8 animate-in fade-in duration-1000 relative overflow-hidden rounded-[2.5rem] p-1 ${userPlan === "FREE" ? "min-h-[300px]" : ""}`}>
            {userPlan === "FREE" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[8px] rounded-[2.5rem] border border-white/5 transition-all px-4">
                <div className="text-center p-6 md:p-8 bg-[#050505] border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] max-w-sm w-full animate-in zoom-in-95 duration-500 border-t-white/20">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                    <Crown className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 tracking-tighter">Unlock Co-pilot</h3>
                  <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed font-medium">Get AI-powered strategic analysis and market opportunities tailored to your assets.</p>
                      <button 
                        onClick={() => window.location.href = "/pricing"}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/20"
                      >
                        Upgrade to Premium
                      </button>
                </div>
              </div>
            )}

            <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-white/10 ${userPlan === "FREE" ? "opacity-30 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative p-3 bg-card border border-white/10 rounded-xl">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
                    Investment Co-pilot
                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-amber-500/20">Premium</span>
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">Curated market analysis tailored to your real exposure</p>
                </div>
              </div>
              <button
                onClick={generateAISummary}
                disabled={aiLoading || userPlan === "FREE"}
                className="group flex items-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${aiLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
                {aiLoading ? "Querying Market..." : aiSummary ? "Recalculate Strategy" : "Activate Co-pilot"}
              </button>
            </div>

            {aiLoading && (
              <div className="py-20 flex flex-col items-center justify-center space-y-6 bg-card/50 rounded-3xl border border-dashed border-white/10 animate-pulse">
                <div className="relative">
                  <div className="w-20 h-20 border-t-4 border-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-bounce" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold tracking-tight">Curating market information...</p>
                  <p className="text-sm text-muted-foreground mt-1">Filtering the noise to give you only what matters.</p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-center font-medium">
                {aiError}
              </div>
            )}

            {aiSummary && !aiLoading && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-8 duration-1000">
                
                {/* Main Insight Widget - The "Executive Pitch" */}
                <div className="md:col-span-8 p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
                    <Brain className="w-64 h-64" />
                  </div>
                  
                  <div className="relative flex flex-col h-full">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4">
                      <TrendingUp className="w-4 h-4" />
                      Exposure Status
                    </div>
                    <h3 className="text-2xl font-bold mb-6 leading-tight">
                      Your market summary today:
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary/40 pl-6 py-2">
                       {aiSummary.summary}
                    </p>
                    
                    <div className="mt-auto pt-8 flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20">
                        <Target className="w-4 h-4" />
                        {aiSummary.diversification.split('.')[0]}
                      </div>
                      <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/20">
                        <ShieldCheck className="w-4 h-4" />
                        Risk: {aiSummary.risk.split('.')[0]}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Co-pilot Strategic Advice Widget */}
                <div className="md:col-span-4 p-8 rounded-3xl bg-primary text-primary-foreground shadow-[0_20px_50px_rgba(37,99,235,0.3)] flex flex-col group transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <Sparkles className="w-8 h-8 opacity-50" />
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">SUGGESTED ACTION</span>
                  </div>
                  <h3 className="text-2xl font-black mb-6 leading-none">Co-pilot Strategic Tips</h3>
                  
                  <div className="space-y-4 flex-1">
                    <p className="text-primary-foreground/90 font-medium leading-relaxed">
                      {aiSummary.opportunities}
                    </p>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/10 text-[10px] font-bold opacity-60 uppercase tracking-widest">
                    Based on sector news and your current Beta exposure
                  </div>
                </div>

                {/* Secondary widgets */}
                <div className="md:col-span-6 p-6 rounded-2xl bg-card border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    Diversification Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiSummary.diversification}
                  </p>
                </div>

                <div className="md:col-span-6 p-6 rounded-2xl bg-card border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    Detailed Risk Assessment
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiSummary.risk}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        {positions.length > 0 && (
          <p className="mt-12 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold py-12 opacity-50 border-t border-white/5">
            Investment Co-pilot · Intelligence applied to the stock market
          </p>
        )}
      </div>
    </div>
  );
}

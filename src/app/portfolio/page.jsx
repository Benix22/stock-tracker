"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBatchStockQuotes } from "@/actions/stock";

// ─── Types ────────────────────────────────────────────────────────────────────
// Position: { id, ticker, shares, avgPrice, addedAt }
// Quote:    { ticker, price, change, changePct, currency }

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


// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = "stock_tracker_portfolio";
function loadPositions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function savePositions(positions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

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

function AddPositionModal({ onAdd, onClose, existingTickers }) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const t = ticker.trim().toUpperCase();
    const s = parseFloat(shares);
    const p = parseFloat(avgPrice);
    if (!t) return setError("Introduce un ticker (ej: AAPL)");
    if (!s || s <= 0) return setError("Cantidad de acciones inválida");
    if (!p || p <= 0) return setError("Precio de compra inválido");
    onAdd({ ticker: t, shares: s, avgPrice: p });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
        <h3 className="mb-5 text-lg font-bold text-foreground">Añadir posición</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ticker
            </label>
            <input
              autoFocus
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Ej: NVDA, AAPL, MSFT…"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Nº acciones
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Precio de compra
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="150.00"
                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [positions, setPositions] = useState([]);
  const [quotes, setQuotes] = useState({}); // { [ticker]: Quote }
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState("value"); // "value" | "pl" | "plPct" | "ticker"

  // Load from localStorage on mount
  useEffect(() => {
    setPositions(loadPositions());
  }, []);

  // Fetch quotes whenever positions change
  const refreshQuotes = useCallback(async () => {
    if (positions.length === 0) return;
    setLoading(true);
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
      setLoading(false);
    }
  }, [positions]);

  useEffect(() => {
    refreshQuotes();
    const interval = setInterval(refreshQuotes, 60_000); // auto-refresh every minute
    return () => clearInterval(interval);
  }, [refreshQuotes]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addPosition = (pos) => {
    // If ticker already exists, merge (add shares, recalculate avg)
    const existing = positions.find((p) => p.ticker === pos.ticker);
    let updated;
    if (existing) {
      const totalShares = existing.shares + pos.shares;
      const avgPrice =
        (existing.shares * existing.avgPrice + pos.shares * pos.avgPrice) / totalShares;
      updated = positions.map((p) =>
        p.ticker === pos.ticker ? { ...p, shares: totalShares, avgPrice } : p
      );
    } else {
      updated = [...positions, { ...pos, id: Date.now() }];
    }
    setPositions(updated);
    savePositions(updated);
  };

  const removePosition = (id) => {
    const updated = positions.filter((p) => p.id !== id);
    setPositions(updated);
    savePositions(updated);
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {showModal && (
          <AddPositionModal
            onAdd={addPosition}
            onClose={() => setShowModal(false)}
            existingTickers={positions.map((p) => p.ticker)}
          />
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Mi Portfolio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {lastUpdated
                ? `Actualizado: ${lastUpdated.toLocaleTimeString("es-ES")} · Auto-refresh cada 60s`
                : "Cargando cotizaciones…"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshQuotes}
              disabled={loading}
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
                className={loading ? "animate-spin" : ""}
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
              Añadir posición
            </button>
          </div>
        </div>
      </div>

        {/* Summary cards */}
        {positions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Valor total"
              value={fmtCurrency(totalValue)}
              sub={`Coste: ${fmtCurrency(totalCost)}`}
              neutral
            />
            <StatCard
              label="P&L total"
              value={fmtCurrency(totalPL)}
              sub={fmtPct(totalPLPct)}
              positive={totalPL >= 0}
              negative={totalPL < 0}
            />
            <StatCard
              label="Cambio hoy"
              value={fmtCurrency(totalDayChange)}
              sub="Variación diaria"
              positive={totalDayChange >= 0}
              negative={totalDayChange < 0}
            />
            <StatCard
              label="Posiciones"
              value={positions.length}
              sub="activos en cartera"
              neutral
            />
          </div>
        )}

        {/* Empty state */}
        {positions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Portfolio vacío</h2>
            <p className="mt-1 text-sm text-muted-foreground">Añade tu primera posición para ver tu P&L en tiempo real.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              Añadir posición
            </button>
          </div>
        )}

        {/* Positions table */}
        {positions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {[
                { key: "ticker", label: "Activo" },
                { key: null, label: "Precio" },
                { key: null, label: "Posición" },
                { key: "value", label: "Valor" },
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
                  className="group relative grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b px-5 py-4 transition hover:bg-muted/50 last:border-0"
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
                      <div className="text-xs text-muted-foreground">{fmtNum(pos.shares)} acciones</div>
                    </div>
                  </div>

                  {/* Current price */}
                  <div className="relative flex flex-col justify-center">
                    <div className="tabular-nums text-sm font-medium text-foreground">
                      {pos.currentPrice != null ? fmtCurrency(pos.currentPrice, pos.currency) : "—"}
                    </div>
                    {pos.dayChange != null && (
                      <div className={`text-xs tabular-nums ${dayUp ? "text-emerald-500" : "text-rose-500"}`}>
                        {dayUp ? "+" : ""}{fmtCurrency(pos.dayChange, pos.currency)} hoy
                      </div>
                    )}
                  </div>

                  {/* Cost basis */}
                  <div className="relative flex flex-col justify-center">
                    <div className="tabular-nums text-sm text-foreground">
                      {fmtCurrency(pos.avgPrice, pos.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">precio compra</div>
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
                      onClick={() => removePosition(pos.id)}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      title="Eliminar posición"
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

        {/* Footer note */}
        {positions.length > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Las posiciones se guardan localmente en tu navegador · Precios de Yahoo Finance con ~15 min de retardo
          </p>
        )}
      </div>
    </div>
  );
}

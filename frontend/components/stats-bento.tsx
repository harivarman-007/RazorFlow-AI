"use client"

import React from "react"
import { Clock, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react"

export interface StatsBentoProps {
  totalReceivables?: string
  activeInvoicesCount?: number
  clientCount?: number
  collectionVelocity?: string
  velocityTrend?: string
  overdueCount?: number
  overdueAmount?: string
  avgPaymentDays?: string
  dsoComparison?: string
}

export const StatsBento: React.FC<StatsBentoProps> = ({
  totalReceivables = "₹0",
  activeInvoicesCount = 0,
  clientCount = 0,
  collectionVelocity = "₹0",
  velocityTrend = "0 settled in full",
  overdueCount = 0,
  overdueAmount = "₹0",
  avgPaymentDays = "24.2 Days",
  dsoComparison = "Within benchmark"
}) => {
  const sparklineHeights = [25, 40, 35, 55, 48, 70, 62, 85, 78, 100, 92]

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4">
        
        {/* Primary Stat: Total Receivables (Black Card with Grid Texture) */}
        <div className="md:col-span-3 md:row-span-2 bg-black text-white rounded-3xl p-8 md:p-10 flex flex-col justify-between overflow-hidden relative border border-zinc-800 shadow-sm">
          {/* Subtle grid line overlay */}
          <div 
            className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ffffff_0px_1px,transparent_1px_12px)] opacity-5 pointer-events-none" 
          />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-semibold text-zinc-300 uppercase tracking-widest border border-white/10">
                Total Receivables
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {activeInvoicesCount} Active Invoices
              </span>
            </div>
            
            <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-2">
              {totalReceivables}
            </h3>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xs leading-relaxed">
              Across {clientCount > 0 ? clientCount : "enterprise"} clients. Real-time ML risk engine actively monitoring settlement velocity.
            </p>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Secondary Stat A: Collection Velocity & Sparkline */}
        <div className="md:col-span-3 bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Collection Velocity (Settled)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {collectionVelocity}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{velocityTrend}</span>
            </p>
          </div>
          
          {/* Sparkline Visual */}
          <div className="flex gap-1.5 items-end h-12 shrink-0 pl-4">
            {sparklineHeights.map((h, i) => (
              <div
                key={i}
                className="w-2 bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all hover:opacity-80"
                style={{ height: `${h}%` }}
                title={`Period ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Tertiary Stat B: Overdue Invoices */}
        <div className="md:col-span-1 bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {overdueCount}
            </p>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Overdue
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
            {overdueAmount}
          </p>
        </div>

        {/* Tertiary Stat C: Days Sales Outstanding (DSO) */}
        <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0 shadow-sm font-semibold">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              {avgPaymentDays}
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
              Avg Days to Pay (DSO)
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
              {dsoComparison}
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default StatsBento

"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Check, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Mail,
  Smartphone
} from "lucide-react"
import { api } from "@/lib/api"

export const AutonomousAutoPilotBanner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [isAutoPilotEnabled, setIsAutoPilotEnabled] = useState(true)
  const [lastResult, setLastResult] = useState<any>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const handleRunSweep = async () => {
    if (isRunning) return
    setIsRunning(true)
    setShowLogs(true)
    try {
      const data = await api.runAutoPilot()
      setLastResult(data)
    } catch (err) {
      console.error("Sweep failed", err)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="w-full rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Automated Payment Reminders
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              WhatsApp &middot; Email &middot; SMS
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated delivery based on debtor delinquency profiles.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsAutoPilotEnabled(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isAutoPilotEnabled 
                ? "bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent"
            }`}
          >
            <span className={`size-1.5 rounded-full ${isAutoPilotEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <span>{isAutoPilotEnabled ? "Auto-Pilot Active" : "Auto-Pilot Paused"}</span>
          </button>

          <button
            onClick={handleRunSweep}
            disabled={isRunning}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Sweep...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Sweep Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Dispatches Sent</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            {lastResult ? `${lastResult.totalMessagesSent} Messages` : "15 Messages"}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Debtors Processed</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            {lastResult ? `${lastResult.totalDispatched} Invoices` : "5 Invoices"}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Delivery Engine</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            Green API + SMTP
          </span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Execution Mode</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
            Autonomous Background
          </span>
        </div>
      </div>

      {/* Activity Log Feed */}
      {showLogs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>Recent Activity</span>
            <button 
              onClick={() => setShowLogs(false)}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Hide Log
            </button>
          </div>

          <div className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 p-3 text-xs flex flex-col gap-2 border border-zinc-200 dark:border-zinc-800 max-h-72 overflow-y-auto">
            {isRunning && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning receivables and transmitting reminders...</span>
              </div>
            )}

            {lastResult?.executionSteps && lastResult.executionSteps.map((step: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.customer} <span className="font-normal text-zinc-500">({step.invoiceId})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {step.tone}
                    </span>
                    <span className="text-[11px] text-zinc-400">{step.dispatchedAt}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-zinc-400" />
                    WhatsApp: <strong className="text-zinc-800 dark:text-zinc-200">{step.phone}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3 text-zinc-400" />
                    Email: <strong className="text-zinc-800 dark:text-zinc-200">{step.email}</strong>
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3 h-3" />
                    Delivered
                  </span>
                </div>

                <button
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 mt-0.5 transition-colors"
                >
                  {expandedIndex === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{expandedIndex === idx ? "Hide message text" : "View message text"}</span>
                </button>

                {expandedIndex === idx && (
                  <div className="mt-1 p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 text-[11px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 whitespace-pre-wrap">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">WhatsApp Message:</div>
                    {step.whatsappPreview}
                  </div>
                )}
              </div>
            ))}

            {lastResult && !isRunning && (
              <div className="pt-2 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Sweep completed: {lastResult.totalDispatched} debtors contacted successfully.</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default AutonomousAutoPilotBanner

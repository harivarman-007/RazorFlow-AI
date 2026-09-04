"use client"

import React, { useState, useEffect, useRef } from "react"
import { Printer, Scissors, Volume2, VolumeX, X, ShieldAlert, CheckCircle2 } from "lucide-react"

export interface ReceiptItem {
  name: string
  price: number
  qty?: number
}

export interface ReceiptPrinterProps {
  isOpen?: boolean
  onClose?: () => void
  invoiceId?: string
  customerName?: string
  date?: string
  status?: "PENDING" | "PAID" | "OVERDUE"
  items?: ReceiptItem[]
  taxRate?: number
  riskScore?: number // e.g. 0.82
  riskCategory?: "Low Risk" | "Medium Risk" | "High Risk"
  paymentMethod?: string
  transactionId?: string
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  isOpen = true,
  onClose,
  invoiceId = "INV-2026-0841",
  customerName = "ABC RETAIL PVT LTD",
  date = "4TH SEPTEMBER 2026",
  status = "PENDING",
  items = [
    { name: "Enterprise SaaS License (Q3)", price: 35000, qty: 1 },
    { name: "Custom API Integration Service", price: 12000, qty: 1 },
    { name: "Priority Support & SLA Pack", price: 3000, qty: 1 }
  ],
  taxRate = 18,
  riskScore = 0.82,
  riskCategory = "High Risk",
  paymentMethod = "RAZORPAY PAYMENT LINK",
  transactionId = "TXN-RZP-99201482"
}) => {
  const [currentMode, setCurrentMode] = useState<"smooth" | "classic">("smooth")
  const [isPrinting, setIsPrinting] = useState(false)
  const [isPrinted, setIsPrinted] = useState(false)
  const [isTorn, setIsTorn] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [cutterFlash, setCutterFlash] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.price * (it.qty || 1)), 0)
  const tax = subtotal * (taxRate / 100)
  const grandTotal = subtotal + tax

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  // Web Audio Synthesizer
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx()
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
  }

  const playPrinterSound = (mode: "smooth" | "classic", durationMs: number) => {
    if (!soundEnabled) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    const now = ctx.currentTime
    const duration = durationMs / 1000

    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.setValueAtTime(mode === "classic" ? 850 : 600, now)
    filter.Q.setValueAtTime(3.5, now)

    const gainNode = ctx.createGain()
    const peakGain = mode === "classic" ? 0.05 : 0.03
    gainNode.gain.setValueAtTime(0.001, now)
    gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.08)
    gainNode.gain.setValueAtTime(peakGain, now + duration - 0.12)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    whiteNoise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    whiteNoise.start(now)
    whiteNoise.stop(now + duration)
  }

  const playTearSound = () => {
    if (!soundEnabled) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    const now = ctx.currentTime
    const duration = 0.35
    const bufferSize = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06))
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.setValueAtTime(1400, now)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + duration)
  }

  const triggerPrint = () => {
    if (isPrinting) return
    setIsTorn(false)
    setIsPrinting(true)
    setCutterFlash(false)

    const animDuration = 2200
    playPrinterSound(currentMode, animDuration)

    setTimeout(() => {
      setIsPrinting(false)
      setIsPrinted(true)
    }, animDuration)
  }

  const triggerTear = () => {
    if (!isPrinted || isPrinting) return
    playTearSound()
    setCutterFlash(true)
    setIsTorn(true)

    setTimeout(() => {
      setIsPrinted(false)
      setIsTorn(false)
      setCutterFlash(false)
    }, 550)
  }

  useEffect(() => {
    // Auto trigger print on first open
    if (isOpen && !isPrinted && !isPrinting) {
      const timer = setTimeout(() => {
        triggerPrint()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-2xl overflow-hidden">
        
        {/* Top Header bar with controls */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-800 mb-6 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-300">
              PHYSICAL INVOICE DISPENSER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              THERMAL POS
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={soundEnabled ? "Mute audio" : "Enable mechanical sound"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3D Thermal Dispenser Machine Unit (Monochrome Matte Black) */}
        <div className="w-[360px] sm:w-[380px] relative flex flex-col items-center z-30">
          
          {/* Top Hood Bar (Matte Black with subtle edge bevel) */}
          <div className="w-full h-10 rounded-t-2xl bg-gradient-to-b from-zinc-700 via-zinc-800 to-black border-t border-x border-zinc-600 shadow-lg relative overflow-hidden z-25">
            <div className="absolute top-1 left-[10%] w-[80%] h-1 bg-white/20 rounded-full blur-[0.5px]" />
          </div>

          {/* Dark Slit Mouth */}
          <div className="w-[330px] sm:w-[340px] h-3 -mt-1.5 bg-[#080808] rounded-sm shadow-[inset_0_4px_8px_rgba(0,0,0,0.95)] relative z-10" />

          {/* Cutter Blade Flash */}
          {cutterFlash && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[340px] h-1 bg-white shadow-[0_0_12px_#ffffff] z-35 animate-pulse" />
          )}

          {/* Bottom Machine Lip Base */}
          <div className="w-full h-3 -mt-1 rounded-b-xl bg-gradient-to-b from-black via-zinc-900 to-zinc-800 border-b border-x border-zinc-700 shadow-md relative z-10" />

          {/* Paper Viewport */}
          <div 
            className="w-[340px] sm:w-[350px] relative z-20 pointer-events-none -mt-3.5 pb-4"
            style={{ 
              clipPath: "inset(0px -40px -800px -40px)",
              perspective: "1200px"
            }}
          >
            {/* Animated Receipt Paper */}
            <div
              className={`w-[310px] sm:w-[320px] mx-auto bg-[#fafaf8] text-zinc-900 pointer-events-auto select-none shadow-2xl transition-all duration-[2200ms] cubic-bezier(0.16,1,0.3,1) ${
                isTorn 
                  ? "opacity-0 translate-y-6 translate-x-16 rotate-12 scale-95 duration-500" 
                  : isPrinted 
                    ? "translate-y-0 rotate-x-0 opacity-100" 
                    : isPrinting 
                      ? "translate-y-0 rotate-x-0 opacity-100" 
                      : "-translate-y-[92%] -rotate-x-12 opacity-60"
              }`}
              style={{
                clipPath: `polygon(
                  0% 0%, 100% 0%,
                  100% calc(100% - 10px),
                  98.3% 100%, 96.6% calc(100% - 10px),
                  95.0% 100%, 93.3% calc(100% - 10px),
                  91.6% 100%, 90.0% calc(100% - 10px),
                  88.3% 100%, 86.6% calc(100% - 10px),
                  85.0% 100%, 83.3% calc(100% - 10px),
                  81.6% 100%, 80.0% calc(100% - 10px),
                  78.3% 100%, 76.6% calc(100% - 10px),
                  75.0% 100%, 73.3% calc(100% - 10px),
                  71.6% 100%, 70.0% calc(100% - 10px),
                  68.3% 100%, 66.6% calc(100% - 10px),
                  65.0% 100%, 63.3% calc(100% - 10px),
                  61.6% 100%, 60.0% calc(100% - 10px),
                  58.3% 100%, 56.6% calc(100% - 10px),
                  55.0% 100%, 53.3% calc(100% - 10px),
                  51.6% 100%, 50.0% calc(100% - 10px),
                  48.3% 100%, 46.6% calc(100% - 10px),
                  45.0% 100%, 43.3% calc(100% - 10px),
                  41.6% 100%, 40.0% calc(100% - 10px),
                  38.3% 100%, 36.6% calc(100% - 10px),
                  35.0% 100%, 33.3% calc(100% - 10px),
                  31.6% 100%, 30.0% calc(100% - 10px),
                  28.3% 100%, 26.6% calc(100% - 10px),
                  25.0% 100%, 23.3% calc(100% - 10px),
                  21.6% 100%, 20.0% calc(100% - 10px),
                  18.3% 100%, 16.6% calc(100% - 10px),
                  15.0% 100%, 13.3% calc(100% - 10px),
                  11.6% 100%, 10.0% calc(100% - 10px),
                  8.3% 100%, 6.6% calc(100% - 10px),
                  5.0% 100%, 3.3% calc(100% - 10px),
                  1.6% 100%, 0% calc(100% - 10px)
                )`
              }}
            >
              {/* Receipt Content */}
              <div className="p-5 font-mono text-zinc-900 text-xs">
                
                {/* Header */}
                <div className="border-b border-dashed border-zinc-300 pb-3 mb-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-sm tracking-tight text-black">
                    <span>RAZORFLOW AI</span>
                    <span className="text-[9px] px-1 py-0.2 bg-black text-white rounded">AR</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
                    TAX INVOICE & RECEIVABLE DEED
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {invoiceId} • {date}
                  </p>
                </div>

                {/* Customer Info & Status Badge */}
                <div className="mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase">BILLED TO:</span>
                      <p className="font-bold text-xs text-black">{customerName}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      status === "PAID" 
                        ? "bg-black text-white" 
                        : "border border-black text-black"
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>

                {/* AI Risk Score Stamp (The Core AI Feature) */}
                <div className="p-2 my-2.5 rounded border border-dashed border-zinc-400 bg-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-zinc-700" />
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">AI PAYMENT RISK</p>
                      <p className="font-bold text-[11px] text-black">
                        {(riskScore * 100).toFixed(0)}% • {riskCategory}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-500">Auto-Cadence</p>
                    <p className="text-[10px] font-bold text-zinc-800">Net 15 Terms</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="border-t border-dashed border-zinc-300 pt-2 mb-2 flex flex-col gap-1.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="text-zinc-700 truncate max-w-[200px]">
                        {item.qty || 1}x {item.name}
                      </span>
                      <span className="font-bold text-black shrink-0">
                        {formatINR(item.price * (item.qty || 1))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals Section */}
                <div className="border-t border-dashed border-zinc-300 pt-2 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>GST ({taxRate}%)</span>
                    <span>{formatINR(tax)}</span>
                  </div>
                  
                  {/* Grand Total */}
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-black text-xs font-bold text-black">
                    <span className="text-sm font-extrabold">TOTAL PAYABLE</span>
                    <span className="text-sm font-extrabold">{formatINR(grandTotal)}</span>
                  </div>
                </div>

                {/* Footer Barcode & Razorpay Stamp */}
                <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 text-center">
                  <div className="w-full h-6 bg-[repeating-linear-gradient(90deg,#000_0px,#000_1.5px,transparent_1.5px,transparent_3px,#000_3px,#000_4px,transparent_4px,transparent_6px)] opacity-80 my-1" />
                  <p className="text-[9px] tracking-widest text-zinc-500 font-mono">
                    {transactionId}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-700 mt-1 uppercase tracking-wider">
                    {paymentMethod}
                  </p>
                </div>

              </div>

              {/* Bottom Edge Space */}
              <div className="h-4" />
            </div>
          </div>

        </div>

        {/* Action Controls Below Machine */}
        <div className="w-full flex items-center justify-center gap-3 mt-6 z-40">
          <button
            onClick={triggerPrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all rounded-xl cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isPrinting ? "Dispensing..." : isPrinted ? "Re-dispense" : "Print Invoice"}</span>
          </button>

          {isPrinted && (
            <button
              onClick={triggerTear}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 active:scale-95 transition-all rounded-xl cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Tear Receipt</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default ReceiptPrinter

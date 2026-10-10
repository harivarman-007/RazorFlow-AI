"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  FileText, 
  ShieldAlert, 
  Bell, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Menu, 
  X, 
  Sun, 
  Moon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import RazorFlowLogo from "@/components/logo"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

// Simple Theme Toggle for Mobile
const MobileThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-8 h-8" />

  const isDark = theme === "dark" || resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white cursor-pointer"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4 text-zinc-200" /> : <Moon className="w-4 h-4 text-zinc-200" />}
    </button>
  )
}

interface NotchNavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode
  onNewInvoice?: () => void
  onOpenCopilot?: () => void
}

export function NotchNavbar({ 
  className, 
  onNewInvoice,
  onOpenCopilot,
  logo,
  ...props 
}: NotchNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation items for our site (equal 3 on left, 3 on right)
  const items = {
    left: [
      { label: "Overview", id: "overview", icon: FileText },
      { label: "Auto-Pilot", id: "autopilot", icon: ShieldAlert },
      { label: "Cadence", id: "collections", icon: Clock }
    ],
    right: [
      { label: "Cash Flow", id: "forecast", icon: TrendingUp },
      { label: "Invoices", id: "invoices", icon: FileText },
      { label: "AI Copilot", id: "bi-copilot", icon: Sparkles }
    ]
  }

  const handleNavClick = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    setIsMobileMenuOpen(false)
    if (id === "bi-copilot") {
      onOpenCopilot?.()
      return
    }
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.replaceState(null, "", `#${id}`)
    }
  }

  return (
    <>
      <header className={cn("fixed top-0 inset-x-0 z-50 h-16 flex px-0 select-none", className)} {...props}>
        
        {/* Left Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-black z-20 relative min-w-0">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
          </svg>
        </div>

        {/* Responsive Notch Container - 3 Slices */}
        <div className="flex h-16 relative z-10 shrink-0 -ml-px">
          
          {/* Left Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-black" style={{ clipPath: "path('M0 0 H50 V64 C25 64 25 40 0 40 Z')" }} />
            {/* Outlines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
              <path d="M0 39.5 C25 39.5 25 63.5 50 63.5" fill="none" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
              <path d="M0 36.5 C25 36.5 25 60.5 50 60.5" fill="none" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
            </svg>
          </div>

          {/* Center Slice (Flexible Content Area) */}
          <div className="flex-1 h-full relative min-w-0 -ml-px">
             {/* Background & Lines Layer */}
             <div className="absolute inset-0 bg-black">
                 <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                   <line x1="0" y1="63.5" x2="100%" y2="63.5" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
                   <line x1="0" y1="60.5" x2="100%" y2="60.5" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
                 </svg>
             </div>

             {/* Content Layer - Perfectly centered vertical axis */}
             <div className="relative w-full h-full flex items-end pb-2 px-3 md:px-5">
               <div className="w-full h-9 flex items-center justify-between gap-3 lg:gap-6">
               
                 {/* Desktop Left Nav */}
                 <nav className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0">
                  {items.left.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={(e) => handleNavClick(item.id, e)}
                      className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer py-1"
                    >
                      <item.icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Mobile Menu Button (Left) */}
                <button 
                  type="button"
                  className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Logo & Platform Title (Center) */}
                <div className="flex items-center justify-center shrink-0">
                  {logo || (
                    <button 
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="flex items-center gap-2 group cursor-pointer focus:outline-none"
                    >
                      <RazorFlowLogo className="w-4 h-4 text-white group-hover:scale-105 transition-transform shrink-0" />
                      <span className="font-semibold text-xs tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                        RazorFlow AI
                      </span>
                    </button>
                  )}
                </div>

                {/* Desktop Right Nav */}
                <nav className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0">
                  {items.right.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={(e) => handleNavClick(item.id, e)}
                      className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer py-1"
                    >
                      <item.icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  
                  <div className="flex items-center gap-2.5 pl-3 border-l border-white/15 shrink-0">
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={onNewInvoice}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 active:scale-95 rounded-full transition-all whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>New Invoice</span>
                    </button>
                  </div>
                </nav>

                {/* Mobile Right Actions */}
                <div className="md:hidden flex items-center gap-2">
                  <MobileThemeToggle />
                </div>

               </div>
             </div>
          </div>

          {/* Right Slice (Corner) */}
          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-black" style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 64 0 64 Z')" }} />
            {/* Outlines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 64">
              <path d="M0 63.5 C25 63.5 25 39.5 50 39.5" fill="none" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
              <path d="M0 60.5 C25 60.5 25 36.5 50 36.5" fill="none" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
            </svg>
          </div>

        </div>

        {/* Right Side Bar - Flexible width */}
        <div className="flex-1 h-10 bg-black z-20 relative min-w-0 -ml-px">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="white" strokeOpacity={0.12} strokeWidth={0.5} />
          </svg>
        </div>

      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-black border-b border-zinc-800 p-4 md:hidden shadow-2xl"
          >
             <nav className="flex flex-col gap-2">
               {[...items.left, ...items.right].map(item => (
                 <button 
                   key={item.label} 
                   type="button"
                   onClick={(e) => handleNavClick(item.id, e)}
                   className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left w-full cursor-pointer"
                 >
                   <item.icon className="w-5 h-5 text-zinc-400" />
                   <span className="font-medium text-white">{item.label}</span>
                 </button>
               ))}
               <div className="h-px bg-zinc-800 my-2" />
               <button 
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    onNewInvoice?.()
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white text-black font-medium text-sm mt-1 cursor-pointer"
               >
                 <Plus className="w-4 h-4" />
                 <span>New Invoice</span>
               </button>
             </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, RotateCw } from "lucide-react"

export interface HoverRevealCardProps {
  // Front Props
  frontBadge?: string
  frontTitle?: string
  frontDescription?: string
  frontFooterLabel?: string
  frontFooterNumber?: string
  
  // Hover (Revealed) Props
  hoverBadge?: string
  hoverTitle?: string
  hoverDescription?: string
  hoverFooterLabel?: string
  hoverFooterNumber?: string

  // Optional custom action
  onAction?: () => void
}

export const HoverRevealCard: React.FC<HoverRevealCardProps> = ({
  frontBadge = "Hover to reveal",
  frontTitle = "Tone-Adaptive Smart Reminders",
  frontDescription = "AI analyzes past payment velocity, credit terms, and relationship risk to draft tailored collection copy automatically.",
  frontFooterLabel = "Agent 3 Feature",
  frontFooterNumber = "01",

  hoverBadge = "How it works",
  hoverTitle = "Friendly to Urgent in 1-Click",
  hoverDescription = "Low risk gets warm courtesy notes. High risk (>70%) gets formal legal & executive notices with Razorpay UPI links.",
  hoverFooterLabel = "Preview Reminder Draft",
  hoverFooterNumber = "02",
  onAction
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAction}
      className="relative w-full max-w-[350px] h-[420px] rounded-[28px] p-7 flex flex-col justify-between cursor-pointer select-none overflow-hidden transition-all duration-700"
      animate={{
        background: isHovered 
          ? "linear-gradient(145deg, rgb(216, 255, 241) 0%, rgb(116, 247, 198) 52%, rgb(145, 184, 255) 100%)" 
          : "linear-gradient(145deg, rgb(20, 22, 31) 0%, rgb(37, 40, 58) 58%, rgb(17, 19, 26) 100%)",
        borderColor: isHovered ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.12)",
        boxShadow: isHovered 
          ? "0px 34px 90px 0px rgba(75, 183, 158, 0.38)" 
          : "0px 28px 70px 0px rgba(0, 0, 0, 0.42)"
      }}
      style={{
        borderWidth: "1px",
        borderStyle: "solid"
      }}
      transition={{ duration: 0.7, type: "spring", bounce: 0.18 }}
    >
      {/* 1. Header (Status Pill + Flip Icon) */}
      <div className="flex items-center justify-between w-full z-10">
        
        {/* Status Pill */}
        <motion.div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
          animate={{
            backgroundColor: isHovered ? "rgba(17, 19, 26, 0.12)" : "rgba(255, 255, 255, 0.08)",
            borderColor: isHovered ? "rgba(17, 19, 26, 0.16)" : "rgba(255, 255, 255, 0.12)",
            color: isHovered ? "rgba(17, 19, 26, 0.78)" : "rgba(255, 255, 255, 0.82)"
          }}
          transition={{ duration: 0.4 }}
        >
          {/* Green Accent Dot */}
          <motion.div 
            className="w-2 h-2 rounded-full"
            animate={{
              backgroundColor: isHovered ? "rgb(17, 19, 26)" : "#74f7c6"
            }}
            transition={{ duration: 0.4 }}
          />
          <span className="tracking-wide text-[11px] font-semibold">
            {isHovered ? hoverBadge : frontBadge}
          </span>
        </motion.div>

        {/* Flip / Rotation Icon with Green Accent */}
        <motion.div
          animate={{
            rotate: isHovered ? 180 : 0,
            color: isHovered ? "rgb(17, 19, 26)" : "#74f7c6",
            opacity: isHovered ? 0.85 : 0.95
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="size-7 rounded-full flex items-center justify-center"
        >
          <RotateCw className="w-4 h-4" />
        </motion.div>
      </div>

      {/* 2. Middle (Title + Description with spring text animation) */}
      <div className="flex flex-col gap-3.5 my-auto z-10">
        {/* Title */}
        <motion.h3 
          className="text-2xl sm:text-[28px] font-bold tracking-tight leading-[1.08]"
          key={isHovered ? "hover-title" : "front-title"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            color: isHovered ? "rgb(17, 19, 26)" : "rgb(255, 255, 255)"
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {isHovered ? hoverTitle : frontTitle}
        </motion.h3>

        {/* Description Body */}
        <motion.p 
          className="text-sm leading-relaxed"
          key={isHovered ? "hover-desc" : "front-desc"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            color: isHovered ? "rgba(17, 19, 26, 0.72)" : "rgba(255, 255, 255, 0.68)"
          }}
          transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
        >
          {isHovered ? hoverDescription : frontDescription}
        </motion.p>
      </div>

      {/* 3. Footer (Link Label + Green Index Number) */}
      <div className="flex items-center justify-between w-full pt-4 border-t z-10"
        style={{
          borderColor: isHovered ? "rgba(17, 19, 26, 0.15)" : "rgba(255, 255, 255, 0.12)"
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold"
          style={{
            color: isHovered ? "rgba(17, 19, 26, 0.66)" : "rgba(255, 255, 255, 0.6)"
          }}
        >
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-zinc-900" />
            </motion.div>
          )}
          <span>{isHovered ? hoverFooterLabel : frontFooterLabel}</span>
        </div>

        {/* Green Index Number */}
        <motion.span 
          className="font-mono font-bold text-sm tracking-wider"
          animate={{
            color: isHovered ? "#11131a" : "#74f7c6"
          }}
          transition={{ duration: 0.4 }}
        >
          {isHovered ? hoverFooterNumber : frontFooterNumber}
        </motion.span>
      </div>

    </motion.div>
  )
}

export default HoverRevealCard

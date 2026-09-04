import React from "react"

export default function RazorFlowLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M13 7l-4 6h4l-1 4 4-6h-4l1-4z" fill="currentColor" stroke="none" />
    </svg>
  )
}

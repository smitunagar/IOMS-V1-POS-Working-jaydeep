import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

export function Calendar({ className, selected, onSelect }: CalendarProps) {
  return (
    <div className={cn("p-3", className)}>
      <div className="space-y-4">
        <div className="text-sm font-medium">Select date range</div>
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {/* Simplified calendar - in production, use react-day-picker */}
          <div className="p-2 text-muted-foreground">S</div>
          <div className="p-2 text-muted-foreground">M</div>
          <div className="p-2 text-muted-foreground">T</div>
          <div className="p-2 text-muted-foreground">W</div>
          <div className="p-2 text-muted-foreground">T</div>
          <div className="p-2 text-muted-foreground">F</div>
          <div className="p-2 text-muted-foreground">S</div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Calendar component placeholder
        </div>
      </div>
    </div>
  )
}

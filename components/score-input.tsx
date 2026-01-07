"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ALLOWED_SCORES } from "@/lib/game-logic"

interface ScoreInputProps {
  onSelect: (score: number) => void
  onClose: () => void
}

export function ScoreInput({ onSelect, onClose }: ScoreInputProps) {
  const scoreLabels: Record<number, string> = {
    [-30]: "ناقص ٣٠",
    [-60]: "ناقص ٦٠",
    [100]: "+١٠٠",
    [200]: "+٢٠٠",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-x-0 bottom-0 bg-card border-t border-border p-4 rounded-t-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">اختر النقاط</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALLOWED_SCORES.map((score) => (
          <Button
            key={score}
            onClick={() => onSelect(score)}
            variant={score < 0 ? "default" : "destructive"}
            className={`h-16 text-xl font-bold ${
              score < 0 ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-accent hover:bg-accent/90"
            }`}
          >
            {scoreLabels[score]}
          </Button>
        ))}
      </div>
    </motion.div>
  )
}

"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skull } from "lucide-react"
import type { GamePlayer, Player, Score } from "@/lib/types"

interface PlayerCardProps {
  gamePlayer: GamePlayer & { player: Player; scores?: Score[] }
  roundScore?: number
  isSelected: boolean
  isFateet: boolean
  onClick: () => void
  index: number
}

export function PlayerCard({ gamePlayer, roundScore, isSelected, isFateet, onClick, index }: PlayerCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card
        onClick={onClick}
        className={`p-4 cursor-pointer transition-all relative overflow-hidden ${
          isSelected
            ? "ring-2 ring-primary bg-primary/10"
            : isFateet
              ? "ring-2 ring-accent bg-accent/10"
              : "bg-card hover:bg-card/80"
        }`}
      >
        {/* Fateet Badge */}
        {isFateet && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 left-2">
            <Badge variant="destructive" className="gap-1">
              <Skull className="w-3 h-3" />
              فتيت
            </Badge>
          </motion.div>
        )}

        {/* Player Name */}
        <h3 className="font-bold text-lg mb-2 text-foreground">{gamePlayer.player.name}</h3>

        {/* Total Score */}
        <div className="text-3xl font-bold mb-2">
          <span className={gamePlayer.total_score >= 0 ? "text-accent" : "text-success"}>{gamePlayer.total_score}</span>
        </div>

        {/* Round Score (if entered) */}
        {roundScore !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-sm font-medium ${roundScore >= 0 ? "text-accent" : "text-success"}`}
          >
            {roundScore > 0 ? `+${roundScore}` : roundScore}
          </motion.div>
        )}

        {/* Tap to add indicator */}
        {roundScore === undefined && <p className="text-xs text-muted-foreground mt-2">اضغط لإدخال النقاط</p>}
      </Card>
    </motion.div>
  )
}

"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Skull, Medal } from "lucide-react"
import type { GamePlayer, Player } from "@/lib/types"
import { determineWinner, determineFateet, getArabicRank } from "@/lib/game-logic"

interface GameOverModalProps {
  isOpen: boolean
  gamePlayers: (GamePlayer & { player: Player })[]
  onClose: () => void
}

export function GameOverModal({ isOpen, gamePlayers, onClose }: GameOverModalProps) {
  if (!isOpen) return null

  const sortedPlayers = [...gamePlayers].sort((a, b) => a.total_score - b.total_score)
  const winner = determineWinner(gamePlayers)
  const fateet = determineFateet(gamePlayers)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="p-6 bg-card">
              <div className="text-center mb-6">
                <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">انتهت اللعبة!</h2>
                <p className="text-muted-foreground">النتائج النهائية</p>
              </div>

              <div className="space-y-3">
                {sortedPlayers.map((player, index) => {
                  const isWinner = player.id === winner?.id
                  const isFateet = player.id === fateet?.id

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isWinner
                          ? "bg-success/20 ring-2 ring-success"
                          : isFateet
                            ? "bg-accent/20 ring-2 ring-accent"
                            : "bg-secondary"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        {isWinner ? (
                          <Trophy className="w-4 h-4 text-success" />
                        ) : isFateet ? (
                          <Skull className="w-4 h-4 text-accent" />
                        ) : (
                          <Medal className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-bold">{player.player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getArabicRank(index + 1)}
                          {isWinner && " - الفائز 🏆"}
                          {isFateet && " - فتيت 💀"}
                        </p>
                      </div>

                      <div className={`text-xl font-bold ${player.total_score >= 0 ? "text-accent" : "text-success"}`}>
                        {player.total_score}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <Button onClick={onClose} className="w-full mt-6 h-12">
                العودة للرئيسية
              </Button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

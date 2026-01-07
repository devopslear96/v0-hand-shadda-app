"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, Mic, MicOff } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { TOTAL_ROUNDS, determineFateet, playFateetAudio, parseArabicVoiceInput } from "@/lib/game-logic"
import type { Game, GamePlayer, Player, Round, Score } from "@/lib/types"
import { ScoreInput } from "@/components/score-input"
import { PlayerCard } from "@/components/player-card"
import { GameOverModal } from "@/components/game-over-modal"

interface GamePageProps {
  params: Promise<{ id: string }>
}

interface GamePlayerWithDetails extends GamePlayer {
  player: Player
  scores: Score[]
}

export default function GamePage({ params }: GamePageProps) {
  const { id: gameId } = use(params)
  const router = useRouter()

  const [game, setGame] = useState<Game | null>(null)
  const [gamePlayers, setGamePlayers] = useState<GamePlayerWithDetails[]>([])
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [roundScores, setRoundScores] = useState<Record<string, number>>({})
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGame = useCallback(async () => {
    const supabase = createClient()

    // Load game
    const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single()

    if (gameError || !gameData) {
      setError("فشل في تحميل اللعبة")
      setIsLoading(false)
      return
    }

    setGame(gameData)

    // Load game players with player info
    const { data: playersData, error: playersError } = await supabase
      .from("game_players")
      .select(`
        *,
        player:players(*)
      `)
      .eq("game_id", gameId)

    if (playersError) {
      setError("فشل في تحميل اللاعبين")
      setIsLoading(false)
      return
    }

    // Load all scores for this game
    const { data: scoresData } = await supabase
      .from("scores")
      .select(`
        *,
        round:rounds!inner(game_id)
      `)
      .eq("round.game_id", gameId)

    // Attach scores to players
    const playersWithScores = (playersData || []).map((gp) => ({
      ...gp,
      scores: (scoresData || []).filter((s) => s.game_player_id === gp.id),
    }))

    setGamePlayers(playersWithScores)

    // Load current round
    const { data: roundData } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", gameId)
      .eq("round_number", gameData.current_round)
      .single()

    setCurrentRound(roundData)

    // Check if game is completed
    if (gameData.is_completed) {
      setShowGameOver(true)
    }

    setIsLoading(false)
  }, [gameId])

  useEffect(() => {
    loadGame()
  }, [loadGame])

  function handleScoreSelect(score: number) {
    if (!selectedPlayer) return

    setRoundScores((prev) => ({
      ...prev,
      [selectedPlayer]: score,
    }))
    setSelectedPlayer(null)
  }

  async function submitRound() {
    if (!currentRound || !game) return

    // Check all players have scores
    const allPlayersScored = gamePlayers.every((gp) => roundScores[gp.id] !== undefined)

    if (!allPlayersScored) {
      setError("يجب إدخال نقاط جميع اللاعبين")
      return
    }

    setIsSaving(true)
    setError(null)

    const supabase = createClient()

    // Save scores
    const scoresToInsert = Object.entries(roundScores).map(([gamePlayerId, scoreValue]) => ({
      round_id: currentRound.id,
      game_player_id: gamePlayerId,
      score_value: scoreValue,
    }))

    const { error: scoresError } = await supabase.from("scores").insert(scoresToInsert)

    if (scoresError) {
      setError("فشل في حفظ النقاط")
      setIsSaving(false)
      return
    }

    // Update player totals
    for (const [gamePlayerId, scoreValue] of Object.entries(roundScores)) {
      const player = gamePlayers.find((gp) => gp.id === gamePlayerId)
      if (player) {
        await supabase
          .from("game_players")
          .update({ total_score: player.total_score + scoreValue })
          .eq("id", gamePlayerId)
      }
    }

    // Mark current round as completed
    await supabase.from("rounds").update({ is_completed: true }).eq("id", currentRound.id)

    const newRoundNumber = game.current_round + 1

    if (newRoundNumber > TOTAL_ROUNDS) {
      // Game is complete
      // Calculate final fateet
      const updatedPlayers = gamePlayers.map((gp) => ({
        ...gp,
        total_score: gp.total_score + (roundScores[gp.id] || 0),
      }))

      const fateet = determineFateet(updatedPlayers)

      if (fateet) {
        await supabase.from("game_players").update({ is_fateet: true }).eq("id", fateet.id)
      }

      await supabase.from("games").update({ is_completed: true }).eq("id", gameId)

      setShowGameOver(true)
    } else {
      // Create next round
      const { data: newRound } = await supabase
        .from("rounds")
        .insert({
          game_id: gameId,
          round_number: newRoundNumber,
        })
        .select()
        .single()

      await supabase.from("games").update({ current_round: newRoundNumber }).eq("id", gameId)

      // Update fateet status and play audio (from round 2 onwards)
      if (newRoundNumber >= 2) {
        const updatedPlayers = gamePlayers.map((gp) => ({
          ...gp,
          total_score: gp.total_score + (roundScores[gp.id] || 0),
        }))

        const fateet = determineFateet(updatedPlayers)

        if (fateet) {
          // Reset all fateet status
          await supabase.from("game_players").update({ is_fateet: false }).eq("game_id", gameId)

          // Set new fateet
          await supabase.from("game_players").update({ is_fateet: true }).eq("id", fateet.id)

          // Play audio
          const playerName = fateet.player?.name || "اللاعب"
          playFateetAudio(playerName)
        }
      }

      setCurrentRound(newRound)
    }

    setRoundScores({})
    await loadGame()
    setIsSaving(false)
  }

  // Voice input handler
  function startVoiceInput() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("المتصفح لا يدعم الإدخال الصوتي")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = "ar-SA"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      const parsed = parseArabicVoiceInput(transcript)

      if (parsed) {
        // Find player by name
        const player = gamePlayers.find(
          (gp) => gp.player.name.includes(parsed.playerName) || parsed.playerName.includes(gp.player.name),
        )

        if (player) {
          setRoundScores((prev) => ({
            ...prev,
            [player.id]: parsed.score,
          }))
        }
      }
    }

    recognition.start()
  }

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-background p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!game) {
    return (
      <main className="min-h-dvh bg-background p-4 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">اللعبة غير موجودة</p>
        <Button onClick={() => router.push("/")}>العودة للرئيسية</Button>
      </main>
    )
  }

  const fateet = determineFateet(gamePlayers)

  return (
    <main className="min-h-dvh bg-background p-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowRight className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-primary">هاند شِدّة</h1>
          <p className="text-sm text-muted-foreground">
            الجولة {game.current_round} من {TOTAL_ROUNDS}
          </p>
        </div>

        <Button variant="ghost" size="icon" onClick={startVoiceInput} disabled={isListening}>
          {isListening ? <MicOff className="w-5 h-5 text-accent animate-pulse" /> : <Mic className="w-5 h-5" />}
        </Button>
      </header>

      {/* Round Progress */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i + 1 < game.current_round ? "bg-success" : i + 1 === game.current_round ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {error && <div className="bg-destructive/20 text-destructive px-4 py-2 rounded-lg mb-4">{error}</div>}

      {/* Players Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <AnimatePresence>
          {gamePlayers.map((gamePlayer, index) => (
            <PlayerCard
              key={gamePlayer.id}
              gamePlayer={gamePlayer}
              roundScore={roundScores[gamePlayer.id]}
              isSelected={selectedPlayer === gamePlayer.id}
              isFateet={fateet?.id === gamePlayer.id}
              onClick={() => setSelectedPlayer(gamePlayer.id)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Score Input */}
      <AnimatePresence>
        {selectedPlayer && <ScoreInput onSelect={handleScoreSelect} onClose={() => setSelectedPlayer(null)} />}
      </AnimatePresence>

      {/* Submit Button */}
      <Button
        onClick={submitRound}
        disabled={isSaving || Object.keys(roundScores).length !== gamePlayers.length}
        className="w-full h-14 text-lg mt-4"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : game.current_round === TOTAL_ROUNDS ? (
          "إنهاء اللعبة"
        ) : (
          "الجولة التالية"
        )}
      </Button>

      {/* Game Over Modal */}
      <GameOverModal isOpen={showGameOver} gamePlayers={gamePlayers} onClose={() => router.push("/")} />
    </main>
  )
}

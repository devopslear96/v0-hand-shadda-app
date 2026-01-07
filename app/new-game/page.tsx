"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Plus, Loader2 } from "lucide-react"
import type { Player } from "@/lib/types"

export default function NewGamePage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlayers()
  }, [])

  async function loadPlayers() {
    const supabase = createClient()
    const { data, error } = await supabase.from("players").select("*").order("name")

    if (error) {
      setError("فشل في تحميل اللاعبين")
      console.error(error)
    } else {
      setPlayers(data || [])
    }
    setIsLoading(false)
  }

  async function addNewPlayer() {
    if (!newPlayerName.trim()) return

    const supabase = createClient()
    const { data, error } = await supabase.from("players").insert({ name: newPlayerName.trim() }).select().single()

    if (error) {
      setError("فشل في إضافة اللاعب")
      console.error(error)
    } else if (data) {
      setPlayers([...players, data])
      setNewPlayerName("")
    }
  }

  function togglePlayer(playerId: string) {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  async function startGame() {
    if (selectedPlayers.length !== 4) {
      setError("يجب اختيار ٤ لاعبين بالضبط")
      return
    }

    setIsCreating(true)
    setError(null)

    const supabase = createClient()

    // Create the game
    const { data: game, error: gameError } = await supabase.from("games").insert({}).select().single()

    if (gameError || !game) {
      setError("فشل في إنشاء اللعبة")
      setIsCreating(false)
      return
    }

    // Add players to the game
    const gamePlayers = selectedPlayers.map((playerId) => ({
      game_id: game.id,
      player_id: playerId,
    }))

    const { error: playersError } = await supabase.from("game_players").insert(gamePlayers)

    if (playersError) {
      setError("فشل في إضافة اللاعبين للعبة")
      setIsCreating(false)
      return
    }

    // Create the first round
    const { error: roundError } = await supabase.from("rounds").insert({
      game_id: game.id,
      round_number: 1,
    })

    if (roundError) {
      setError("فشل في إنشاء الجولة")
      setIsCreating(false)
      return
    }

    // Navigate to the game page
    router.push(`/game/${game.id}`)
  }

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-background p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background p-4">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">لعبة جديدة</h1>
          <p className="text-muted-foreground text-sm">اختر ٤ لاعبين</p>
        </div>
      </header>

      {error && <div className="bg-destructive/20 text-destructive px-4 py-2 rounded-lg mb-4">{error}</div>}

      {/* Add New Player */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">إضافة لاعب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="اسم اللاعب"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNewPlayer()}
              className="flex-1"
            />
            <Button onClick={addNewPlayer} size="icon" className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player Selection */}
      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">اختيار اللاعبين</CardTitle>
          <CardDescription>تم اختيار {selectedPlayers.length} من ٤</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {players.map((player) => {
              const isSelected = selectedPlayers.includes(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`p-3 rounded-lg text-right transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {player.name}
                </button>
              )
            })}
          </div>
          {players.length === 0 && (
            <p className="text-center text-muted-foreground py-8">لا يوجد لاعبون. أضف لاعبين جدد للبدء.</p>
          )}
        </CardContent>
      </Card>

      {/* Start Game Button */}
      <Button onClick={startGame} disabled={selectedPlayers.length !== 4 || isCreating} className="w-full h-14 text-lg">
        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "ابدأ اللعبة"}
      </Button>
    </main>
  )
}

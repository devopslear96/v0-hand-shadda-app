"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, Plus, Trash2, User } from "lucide-react"
import type { Player } from "@/lib/types"

export default function PlayersPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlayers()
  }, [])

  async function loadPlayers() {
    const supabase = createClient()
    const { data, error } = await supabase.from("players").select("*").order("created_at", { ascending: false })

    if (error) {
      setError("فشل في تحميل اللاعبين")
    } else {
      setPlayers(data || [])
    }
    setIsLoading(false)
  }

  async function addPlayer() {
    if (!newPlayerName.trim()) return

    const supabase = createClient()
    const { data, error } = await supabase.from("players").insert({ name: newPlayerName.trim() }).select().single()

    if (error) {
      setError("فشل في إضافة اللاعب")
    } else if (data) {
      setPlayers([data, ...players])
      setNewPlayerName("")
    }
  }

  async function deletePlayer(playerId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("players").delete().eq("id", playerId)

    if (error) {
      setError("فشل في حذف اللاعب")
    } else {
      setPlayers(players.filter((p) => p.id !== playerId))
    }
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
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">اللاعبون</h1>
          <p className="text-muted-foreground text-sm">إدارة قائمة اللاعبين</p>
        </div>
      </header>

      {error && <div className="bg-destructive/20 text-destructive px-4 py-2 rounded-lg mb-4">{error}</div>}

      {/* Add Player */}
      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">إضافة لاعب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="اسم اللاعب"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              className="flex-1"
            />
            <Button onClick={addPlayer} size="icon" className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">قائمة اللاعبين ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا يوجد لاعبون. أضف لاعبين جدد للبدء.</p>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex-1 font-medium">{player.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlayer(player.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

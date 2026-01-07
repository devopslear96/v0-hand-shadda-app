"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2, Trophy, Skull, Calendar, Gamepad2 } from "lucide-react"
import type { Player } from "@/lib/types"

interface DailyStats {
  date: string
  gamesCount: number
}

interface PlayerStatsData {
  player: Player
  totalGames: number
  totalFateet: number
  totalWins: number
}

export default function StatisticsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStatsData[]>([])
  const [totalGames, setTotalGames] = useState(0)

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    const supabase = createClient()

    // Load all completed games
    const { data: games } = await supabase
      .from("games")
      .select("*")
      .eq("is_completed", true)
      .order("game_date", { ascending: false })

    if (games) {
      setTotalGames(games.length)

      // Group by date
      const dateGroups: Record<string, number> = {}
      games.forEach((game) => {
        const date = game.game_date
        dateGroups[date] = (dateGroups[date] || 0) + 1
      })

      const dailyData = Object.entries(dateGroups)
        .map(([date, count]) => ({ date, gamesCount: count }))
        .slice(0, 7) // Last 7 days with games

      setDailyStats(dailyData)
    }

    // Load all players
    const { data: players } = await supabase.from("players").select("*")

    if (players) {
      // Load game_players stats
      const { data: gamePlayers } = await supabase
        .from("game_players")
        .select(`
          *,
          game:games!inner(is_completed)
        `)
        .eq("game.is_completed", true)

      const statsMap: Record<string, PlayerStatsData> = {}

      players.forEach((player) => {
        statsMap[player.id] = {
          player,
          totalGames: 0,
          totalFateet: 0,
          totalWins: 0,
        }
      })

      if (gamePlayers) {
        gamePlayers.forEach((gp) => {
          if (statsMap[gp.player_id]) {
            statsMap[gp.player_id].totalGames++
            if (gp.is_fateet) {
              statsMap[gp.player_id].totalFateet++
            }
          }
        })

        // Calculate wins (lowest score in each game)
        const gameIds = [...new Set(gamePlayers.map((gp) => gp.game_id))]

        for (const gameId of gameIds) {
          const gamePlayersList = gamePlayers.filter((gp) => gp.game_id === gameId)
          if (gamePlayersList.length > 0) {
            const winner = gamePlayersList.reduce((min, gp) => (gp.total_score < min.total_score ? gp : min))
            if (statsMap[winner.player_id]) {
              statsMap[winner.player_id].totalWins++
            }
          }
        }
      }

      const sortedStats = Object.values(statsMap)
        .filter((s) => s.totalGames > 0)
        .sort((a, b) => b.totalWins - a.totalWins)

      setPlayerStats(sortedStats)
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-background p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  const mostFateet = playerStats.reduce((max, p) => (p.totalFateet > max.totalFateet ? p : max), playerStats[0])

  const mostWins = playerStats.reduce((max, p) => (p.totalWins > max.totalWins ? p : max), playerStats[0])

  return (
    <main className="min-h-dvh bg-background p-4">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">الإحصائيات</h1>
          <p className="text-muted-foreground text-sm">سجل الألعاب والنتائج</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-card">
          <CardContent className="p-4">
            <Gamepad2 className="w-8 h-8 text-primary mb-2" />
            <p className="text-3xl font-bold">{totalGames}</p>
            <p className="text-sm text-muted-foreground">إجمالي الألعاب</p>
          </CardContent>
        </Card>

        {mostWins && (
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4">
              <Trophy className="w-8 h-8 text-success mb-2" />
              <p className="text-lg font-bold text-success">{mostWins.player.name}</p>
              <p className="text-sm text-muted-foreground">أكثر فوز ({mostWins.totalWins})</p>
            </CardContent>
          </Card>
        )}

        {mostFateet && (
          <Card className="bg-accent/10 border-accent/20 col-span-2">
            <CardContent className="p-4 flex items-center gap-4">
              <Skull className="w-10 h-10 text-accent" />
              <div>
                <p className="text-lg font-bold text-accent">{mostFateet.player.name}</p>
                <p className="text-sm text-muted-foreground">أكثر فتيت ({mostFateet.totalFateet} مرة)</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Games */}
      {dailyStats.length > 0 && (
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              الألعاب اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyStats.map((stat) => (
                <div key={stat.date} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                  <span className="text-sm">
                    {new Date(stat.date).toLocaleDateString("ar-SA", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-bold text-primary">
                    {stat.gamesCount} {stat.gamesCount === 1 ? "لعبة" : "ألعاب"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Leaderboard */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">ترتيب اللاعبين</CardTitle>
          <CardDescription>حسب عدد مرات الفوز</CardDescription>
        </CardHeader>
        <CardContent>
          {playerStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد إحصائيات بعد</p>
          ) : (
            <div className="space-y-2">
              {playerStats.map((stat, index) => (
                <div key={stat.player.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : index === 1
                          ? "bg-muted text-muted-foreground"
                          : index === 2
                            ? "bg-accent/50 text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{stat.player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.totalGames} لعبة • {stat.totalFateet} فتيت
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-success">{stat.totalWins}</p>
                    <p className="text-xs text-muted-foreground">فوز</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

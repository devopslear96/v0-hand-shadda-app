import type { GamePlayer } from "./types"

// Score values allowed in Hand Shadda
export const ALLOWED_SCORES = [-30, -60, 100, 200] as const
export type AllowedScore = (typeof ALLOWED_SCORES)[number]

// Total rounds in a game
export const TOTAL_ROUNDS = 7

/**
 * Determine the loser (فتيت) - the player with the HIGHEST score
 * In Hand Shadda, the player with the highest positive score loses
 */
export function determineFateet(gamePlayers: GamePlayer[]): GamePlayer | null {
  if (gamePlayers.length === 0) return null

  // Find the player with the highest score
  const sortedPlayers = [...gamePlayers].sort((a, b) => b.total_score - a.total_score)
  return sortedPlayers[0]
}

/**
 * Determine the winner (فائز) - the player with the LOWEST score
 */
export function determineWinner(gamePlayers: GamePlayer[]): GamePlayer | null {
  if (gamePlayers.length === 0) return null

  // Find the player with the lowest score
  const sortedPlayers = [...gamePlayers].sort((a, b) => a.total_score - b.total_score)
  return sortedPlayers[0]
}

/**
 * Check if a score value is valid
 */
export function isValidScore(score: number): score is AllowedScore {
  return ALLOWED_SCORES.includes(score as AllowedScore)
}

/**
 * Parse Arabic voice input to extract player name and score
 * Examples: "محمد مية", "أحمد ناقص ستين"
 */
export function parseArabicVoiceInput(input: string): { playerName: string; score: number } | null {
  const normalizedInput = input.trim().toLowerCase()

  // Arabic number words mapping
  const scoreMap: Record<string, number> = {
    "ناقص ثلاثين": -30,
    "سالب ثلاثين": -30,
    "ناقص تلاتين": -30,
    "سالب تلاتين": -30,
    "-30": -30,
    "ناقص ستين": -60,
    "سالب ستين": -60,
    "-60": -60,
    مية: 100,
    ميه: 100,
    مئة: 100,
    "100": 100,
    ميتين: 200,
    مئتين: 200,
    "200": 200,
  }

  // Try to find a score pattern
  for (const [pattern, score] of Object.entries(scoreMap)) {
    if (normalizedInput.includes(pattern)) {
      // Extract player name (everything before the score pattern)
      const playerName = normalizedInput.replace(pattern, "").trim()
      if (playerName) {
        return { playerName, score }
      }
    }
  }

  return null
}

/**
 * Play the "فتيت وفت" audio feedback
 * Uses Web Speech API for Arabic text-to-speech
 */
export function playFateetAudio(playerName: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return

  const utterance = new SpeechSynthesisUtterance(`يا فتيت ${playerName}، وفت منيح`)
  utterance.lang = "ar-SA"
  utterance.rate = 0.9
  utterance.pitch = 1.1

  window.speechSynthesis.speak(utterance)
}

/**
 * Get rank suffix in Arabic
 */
export function getArabicRank(rank: number): string {
  const ranks: Record<number, string> = {
    1: "الأول",
    2: "الثاني",
    3: "الثالث",
    4: "الرابع",
  }
  return ranks[rank] || `${rank}`
}

export interface Player {
  id: string
  name: string
  created_at: string
}

export interface Game {
  id: string
  game_date: string
  rounds_count: number
  is_completed: boolean
  current_round: number
  created_at: string
}

export interface GamePlayer {
  id: string
  game_id: string
  player_id: string
  total_score: number
  is_fateet: boolean
  created_at: string
  player?: Player
}

export interface Round {
  id: string
  game_id: string
  round_number: number
  is_completed: boolean
  created_at: string
}

export interface Score {
  id: string
  round_id: string
  game_player_id: string
  score_value: number
  created_at: string
}

export interface GameWithPlayers extends Game {
  game_players: (GamePlayer & { player: Player })[]
}

export interface PlayerStats {
  player_id: string
  player_name: string
  total_games: number
  total_fateet: number
  total_rounds_highest: number
}

-- Hand Shadda Game Database Schema
-- هاند شِدّة - نظام تتبع النقاط

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_date DATE DEFAULT CURRENT_DATE,
  rounds_count INT DEFAULT 7,
  is_completed BOOLEAN DEFAULT FALSE,
  current_round INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Players junction table
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  total_score INT DEFAULT 0,
  is_fateet BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number >= 1 AND round_number <= 7),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, round_number)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  game_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  score_value INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, game_player_id)
);

-- Enable Row Level Security (open access for this game app - no auth required)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (game doesn't require authentication)
CREATE POLICY "Allow public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete players" ON players FOR DELETE USING (true);

CREATE POLICY "Allow public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update games" ON games FOR UPDATE USING (true);
CREATE POLICY "Allow public delete games" ON games FOR DELETE USING (true);

CREATE POLICY "Allow public read game_players" ON game_players FOR SELECT USING (true);
CREATE POLICY "Allow public insert game_players" ON game_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update game_players" ON game_players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete game_players" ON game_players FOR DELETE USING (true);

CREATE POLICY "Allow public read rounds" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow public insert rounds" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rounds" ON rounds FOR UPDATE USING (true);
CREATE POLICY "Allow public delete rounds" ON rounds FOR DELETE USING (true);

CREATE POLICY "Allow public read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update scores" ON scores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete scores" ON scores FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_scores_round_id ON scores(round_id);
CREATE INDEX IF NOT EXISTS idx_scores_game_player_id ON scores(game_player_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);

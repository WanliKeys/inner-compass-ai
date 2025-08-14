-- 每日签到表
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS 策略：仅允许本人读写
CREATE POLICY IF NOT EXISTS "Users can view own checkins" ON daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own checkins" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own checkins" ON daily_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own checkins" ON daily_checkins FOR DELETE USING (auth.uid() = user_id);



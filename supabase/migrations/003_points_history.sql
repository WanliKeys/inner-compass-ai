-- 积分历史记录表
CREATE TABLE IF NOT EXISTS points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  points_delta INTEGER NOT NULL,
  source TEXT CHECK (source IN ('checkin', 'record', 'manual')) NOT NULL,
  reference_id UUID,
  note TEXT
);

ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- RLS：仅本人可读写
CREATE POLICY IF NOT EXISTS "Users can view own points history" ON points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own points history" ON points_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own points history" ON points_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own points history" ON points_history FOR DELETE USING (auth.uid() = user_id);



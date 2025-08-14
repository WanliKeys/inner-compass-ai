-- 专注会话日志
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  task_title TEXT,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER NOT NULL,
  is_success BOOLEAN DEFAULT TRUE,
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- 为了幂等性，先删除后创建（重复执行不会报错）
DROP POLICY IF EXISTS "Users can view own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete own focus sessions" ON focus_sessions;

CREATE POLICY "Users can view own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON focus_sessions FOR DELETE USING (auth.uid() = user_id);



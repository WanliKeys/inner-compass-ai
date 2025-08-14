-- Web Push 订阅表
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);



-- 为 profiles 增加提醒时间与时区
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_hour INTEGER CHECK (reminder_hour >= 0 AND reminder_hour <= 23);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_minute INTEGER CHECK (reminder_minute >= 0 AND reminder_minute <= 59);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_timezone TEXT;



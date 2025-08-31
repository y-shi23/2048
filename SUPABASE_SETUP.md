# Supabase 数据库设置

## 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并创建一个新项目
2. 记录项目的 URL 和 anon key

## 2. 配置 GitHub 认证

1. 在 Supabase 项目中，进入 "Authentication" > "Providers"
2. 启用 "GitHub" 提供商
3. 在 GitHub 上创建 OAuth 应用：
   - 回调 URL: `https://your-project.supabase.co/auth/v1/callback`
4. 将 GitHub 的 Client ID 和 Client Secret 添加到 Supabase

## 3. 创建数据库表

在 Supabase SQL 编辑器中运行以下 SQL：

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分数表
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_created_at ON scores(created_at);
CREATE INDEX idx_scores_score ON scores(score DESC);

-- 设置 RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 创建用户表 RLS 策略
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 创建分数表 RLS 策略
CREATE POLICY "Users can view all scores" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建触发器函数，自动创建用户记录
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta->>'user_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 4. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 Supabase 配置：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. 启动应用

```bash
npm install
npm run dev
```

现在用户可以通过 GitHub 登录并开始游戏了！
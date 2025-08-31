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
-- 1) 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) 创建分数表
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) 创建索引
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at);
CREATE INDEX IF NOT EXISTS idx_scores_score ON public.scores(score DESC);

-- 4) 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- 5) users RLS 策略（允许读取所有；仅本人可更改）
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.users;
CREATE POLICY "Enable read access for all users" ON public.users
  FOR SELECT USING (true);
CREATE POLICY "Enable update for own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 6) scores RLS 策略（允许所有读取；认证用户可写入；仅本人可更新）
DROP POLICY IF EXISTS "Enable read access for all users" ON public.scores;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.scores;
DROP POLICY IF EXISTS "Enable update for own scores" ON public.scores;
CREATE POLICY "Enable read access for all users" ON public.scores
  FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.scores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Enable update for own scores" ON public.scores
  FOR UPDATE USING (auth.uid() = user_id);

-- 7) 触发器：在 auth.users 插入后，同步插入 public.users
-- 重要：Supabase 的 auth.users 列为 raw_user_meta_data（而不是 raw_user_meta）
-- 为避免 RLS 影响，使用 SECURITY DEFINER，并固定 search_path
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email    = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 Supabase 配置：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

此外，请在 Supabase Auth 设置中：
- 将 Site URL 配置为你的线上地址（例如：https://2048.nocode.host）
- 在 Additional Redirect URLs 添加：
  - https://2048.nocode.host
  - http://localhost:5173 （本地开发）

## 5. 启动应用

```bash
npm install
npm run dev
```

现在用户可以通过 GitHub 登录并开始游戏了！
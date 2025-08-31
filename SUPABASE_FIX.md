# Supabase 数据库修复指南

## 问题分析

当前错误是因为 RLS (Row Level Security) 策略阻止了应用直接插入用户数据。我们需要使用数据库触发器来自动创建用户记录。

## 修复步骤

### 1. 删除现有的 RLS 策略

在 Supabase SQL 编辑器中运行：

```sql
-- 删除现有的 users 表 RLS 策略
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 删除现有的 scores 表 RLS 策略
DROP POLICY IF EXISTS "Users can view all scores" ON scores;
DROP POLICY IF EXISTS "Users can insert their own scores" ON scores;
```

### 2. 重新创建 RLS 策略

```sql
-- 为 users 表创建新的 RLS 策略
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 为 scores 表创建新的 RLS 策略
CREATE POLICY "Enable read access for all users" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON scores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own scores" ON scores
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. 创建或更新触发器函数

```sql
-- 删除现有的触发器函数（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 创建新的触发器函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta->>'user_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 4. 验证设置

运行以下查询验证设置是否正确：

```sql
-- 检查 RLS 策略
SELECT tablename, policyname, permissive, cmd, roles
FROM pg_policies 
WHERE tablename IN ('users', 'scores')
ORDER BY tablename, policyname;

-- 检查触发器
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 5. 清理现有错误数据（可选）

如果存在错误的用户记录，可以清理：

```sql
-- 删除没有对应 auth 用户的数据
DELETE FROM users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 删除没有对应用户的分数记录
DELETE FROM scores 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

## 临时解决方案

如果上述步骤仍有问题，可以暂时禁用 RLS 来验证功能：

```sql
-- 临时禁用 RLS（仅用于测试）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

-- 测试完成后重新启用
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
```

## 应用代码调整

我已经移除了应用层中的用户创建逻辑，现在完全依赖数据库触发器来处理用户记录的创建。

## 测试步骤

1. 退出当前登录
2. 重新登录应用
3. 检查 Supabase 的 users 表是否自动创建了用户记录
4. 玩一局游戏，检查 scores 表是否保存了分数记录

按照这些步骤操作后，应该可以解决 RLS 策略问题。
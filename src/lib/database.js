import { supabase } from '@/lib/supabase';

export const saveScore = async (userId, score) => {
  const { data, error } = await supabase
    .from('scores')
    .insert([
      {
        user_id: userId,
        score: score,
        created_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const getDailyScores = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      score,
      created_at,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)
    .order('score', { ascending: false })
    .limit(100);
  
  if (error) {
    throw error;
  }
  
  // 处理数据，为每个用户只保留当天最高分
  const userScores = {};
  data.forEach(score => {
    const userId = score.users.id;
    if (!userScores[userId] || score.score > userScores[userId].score) {
      userScores[userId] = {
        ...score,
        users: score.users
      };
    }
  });
  
  return Object.values(userScores).sort((a, b) => b.score - a.score);
};

export const getAllTimeScores = async () => {
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      score,
      created_at,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .order('score', { ascending: false })
    .limit(100);
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const upsertUserProfile = async (user) => {
  const { data, error } = await supabase
    .from('users')
    .upsert([
      {
        id: user.id,
        username: user.user_metadata.user_name || user.email,
        avatar_url: user.user_metadata.avatar_url,
        email: user.email,
        updated_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};
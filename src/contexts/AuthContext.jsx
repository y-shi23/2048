import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser, onAuthStateChange } from '@/lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = onAuthStateChange(async (event, sessionUser) => {
      if (event === 'SIGNED_IN' && sessionUser) {
        setUser(sessionUser);
        setIsGuest(false); // GitHub登录时退出游客模式
        
        // 用户记录应该由数据库触发器自动创建，不在这里手动创建
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (!isGuest) {
          setIsGuest(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInAsGuest = () => {
    setIsGuest(true);
    setUser(null);
  };

  const signOut = async () => {
    try {
      setIsGuest(false);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signOutAsGuest = () => {
    setIsGuest(false);
    setUser(null);
  };

  const value = {
    user,
    isGuest,
    loading,
    signIn,
    signInAsGuest,
    signOut,
    signOutAsGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
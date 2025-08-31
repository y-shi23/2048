import { motion } from 'framer-motion';
import { Github, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { signIn, signInAsGuest, loading, user, isGuest } = useAuth();
  const navigate = useNavigate();

  // 如果用户已经登录或者是游客，重定向到主页
  useEffect(() => {
    if (user || isGuest) {
      navigate('/', { replace: true });
    }
  }, [user, isGuest, navigate]);

  const handleGitHubLogin = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-2048-background p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">2048</h1>
            <p className="text-gray-600 text-lg">合并数字方块，达到2048！</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">欢迎来到2048</h2>
              <p className="text-gray-600">选择登录方式开始游戏</p>
            </div>

            <Button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              size="lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span>使用GitHub登录</span>
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>

            <Button
              onClick={signInAsGuest}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
              size="lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span>游客登录</span>
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p className="font-semibold mb-2">功能对比：</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="font-semibold text-gray-700">GitHub登录</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>✓ 保存游戏分数</li>
                    <li>✓ 查看排行榜</li>
                    <li>✓ 与其他玩家竞争</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">游客登录</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>✓ 查看排行榜</li>
                    <li>✗ 保存游戏分数</li>
                    <li>✗ 排行榜排名</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
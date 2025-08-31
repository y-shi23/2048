import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trophy, Calendar } from "lucide-react";
import { getDailyScores, getAllTimeScores } from "@/lib/database";

const LeaderboardCard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyScores, setDailyScores] = useState([]);
  const [allTimeScores, setAllTimeScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching scores...');
        const [dailyData, allTimeData] = await Promise.all([
          getDailyScores(),
          getAllTimeScores()
        ]);
        
        console.log('Daily scores:', dailyData);
        console.log('All time scores:', allTimeData);
        
        setDailyScores(dailyData || []);
        setAllTimeScores(allTimeData || []);
      } catch (err) {
        console.error('Error fetching scores:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderScores = (scores) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>加载失败: {error}</p>
        </div>
      );
    }

    if (scores.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>暂无分数记录</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {scores.map((score, index) => (
          <div
            key={score.id}
            className={`flex items-center justify-between p-4 rounded-lg ${
              index === 0 ? 'bg-yellow-50 border border-yellow-200' : 
              index === 1 ? 'bg-gray-50 border border-gray-200' : 
              index === 2 ? 'bg-orange-50 border border-orange-200' : 
              'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-400 text-white' : 
                index === 1 ? 'bg-gray-400 text-white' : 
                index === 2 ? 'bg-orange-400 text-white' : 
                'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <img
                src={score.users.avatar_url || `https://ui-avatars.com/api/?name=${score.users.username}&background=random`}
                alt={score.users.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-semibold text-gray-800">{score.users.username}</div>
                <div className="text-sm text-gray-500">{formatTime(score.created_at)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{score.score}</div>
              <div className="text-sm text-gray-500">分</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-xl font-bold flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>排行榜</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'daily'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              今日排行
            </button>
            <button
              onClick={() => setActiveTab('alltime')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'alltime'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              总排行
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-96">
            {activeTab === 'daily' ? renderScores(dailyScores) : renderScores(allTimeScores)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardCard;
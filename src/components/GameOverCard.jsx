import React from 'react';
import { Button } from '@/components/ui/button';

const GameOverCard = ({ gameOver, gameWon, onKeepPlaying, onRestart }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-2048-background p-8 rounded-2048-md shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          {gameOver ? (
            <>
              <h2 className="text-3xl font-bold text-red-600 mb-3">游戏结束!</h2>
              <p className="text-gray-700 mb-6 text-lg">没有可移动的方块了</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-2048-tile-2048 mb-3">恭喜获胜!</h2>
              <p className="text-gray-700 mb-6 text-lg">你成功达到了2048!</p>
              <Button 
                onClick={onKeepPlaying}
                className="bg-2048-tile-2048 hover:bg-2048-tile-1024 text-white mr-3 mb-4"
                size="lg"
              >
                继续游戏
              </Button>
            </>
          )}
          <Button 
            onClick={onRestart}
            className="bg-gray-600 hover:bg-gray-700 text-white w-full"
            size="lg"
          >
            再玩一次
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOverCard;

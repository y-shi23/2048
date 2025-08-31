
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, LogOut, Github } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Confetti } from '@neoconfetti/react';
import { Button } from '@/components/ui/button';
import GameOverCard from '@/components/GameOverCard';
import ScoreHistoryCard from '@/components/ScoreHistoryCard';
import LeaderboardCard from '@/components/LeaderboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { saveScore } from '@/lib/database';
const GRID_SIZE = 4;
const WINNING_TILE = 2048;

const Index = () => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [confetti, setConfetti] = useState(null);
  const [showScoreHistory, setShowScoreHistory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const { user, isGuest, signIn, signOut, signOutAsGuest } = useAuth();
  const confettiContainerRef = useRef(null);
  const confettiTimersRef = useRef({});

  // 初始化游戏棋盘
  const initializeGrid = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    return newGrid;
  }, []);

  // 添加随机数字方块
  const addRandomTile = (grid) => {
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  // 保存分数到历史记录
  const saveScoreToHistory = useCallback((currentScore) => {
    if (currentScore > 0) {
      const newScore = {
        value: currentScore,
        timestamp: Date.now()
      };
      
      setScoreHistory(prevHistory => {
        const updatedHistory = [...prevHistory, newScore]
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // 只保留前10个最高分
        
        localStorage.setItem('2048-score-history', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
  }, []);

  // 加载分数历史记录
  const loadScoreHistory = useCallback(() => {
    const saved = localStorage.getItem('2048-score-history');
    if (saved) {
      setScoreHistory(JSON.parse(saved));
    }
  }, []);

  // 初始化游戏
  const initGame = useCallback(() => {
    const newGrid = initializeGrid();
    
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setKeepPlaying(false);
    setConfetti(null);
  }, [initializeGrid, saveScoreToHistory]);

  // 检查是否可以移动
  const canMove = (grid) => {
    // 检查是否有空格
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) return true;
      }
    }

    // 检查是否有相邻相同的数字
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = grid[i][j];
        if (
          (i < GRID_SIZE - 1 && current === grid[i + 1][j]) ||
          (j < GRID_SIZE - 1 && current === grid[i][j + 1])
        ) {
          return true;
        }
      }
    }

    return false;
  };

  // 移动方块
  const move = (direction) => {
    if (gameOver || (gameWon && !keepPlaying)) return;

    let newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;
    let mergedPositions = [];

    // 根据方向处理移动
    switch (direction) {
      case 'up':
        for (let j = 0; j < GRID_SIZE; j++) {
          const column = [];
          for (let i = 0; i < GRID_SIZE; i++) {
            if (newGrid[i][j] !== 0) {
              column.push(newGrid[i][j]);
            }
          }

          // 合并相同数字
          for (let i = 0; i < column.length - 1; i++) {
            if (column[i] === column[i + 1]) {
              const mergedValue = column[i] * 2;
              column[i] = mergedValue;
              column.splice(i + 1, 1);
              newScore += mergedValue;
              
              // 记录合并位置（在新网格中的最终位置）
              mergedPositions.push({ row: i, col: j, value: mergedValue });
              
              // 检查是否获胜
              if (mergedValue === WINNING_TILE) {
                setGameWon(true);
              }
            }
          }

          // 填充剩余位置
          while (column.length < GRID_SIZE) {
            column.push(0);
          }

          // 更新网格
          for (let i = 0; i < GRID_SIZE; i++) {
            if (newGrid[i][j] !== column[i]) {
              moved = true;
            }
            newGrid[i][j] = column[i];
          }
        }
        break;

      case 'down':
        for (let j = 0; j < GRID_SIZE; j++) {
          const column = [];
          for (let i = GRID_SIZE - 1; i >= 0; i--) {
            if (newGrid[i][j] !== 0) {
              column.push(newGrid[i][j]);
            }
          }

          // 合并相同数字
          for (let i = 0; i < column.length - 1; i++) {
            if (column[i] === column[i + 1]) {
              const mergedValue = column[i] * 2;
              column[i] = mergedValue;
              column.splice(i + 1, 1);
              newScore += mergedValue;
              
              // 记录合并位置（在新网格中的最终位置）
              mergedPositions.push({ row: GRID_SIZE - column.length + i, col: j, value: mergedValue });
              
              // 检查是否获胜
              if (mergedValue === WINNING_TILE) {
                setGameWon(true);
              }
            }
          }

          // 填充剩余位置
          while (column.length < GRID_SIZE) {
            column.push(0);
          }

          // 更新网格
          for (let i = GRID_SIZE - 1; i >= 0; i--) {
            if (newGrid[i][j] !== column[GRID_SIZE - 1 - i]) {
              moved = true;
            }
            newGrid[i][j] = column[GRID_SIZE - 1 - i];
          }
        }
        break;

      case 'left':
        for (let i = 0; i < GRID_SIZE; i++) {
          const row = [];
          for (let j = 0; j < GRID_SIZE; j++) {
            if (newGrid[i][j] !== 0) {
              row.push(newGrid[i][j]);
            }
          }

          // 合并相同数字
          for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
              const mergedValue = row[j] * 2;
              row[j] = mergedValue;
              row.splice(j + 1, 1);
              newScore += mergedValue;
              
              // 记录合并位置（在新网格中的最终位置）
              mergedPositions.push({ row: i, col: j, value: mergedValue });
              
              // 检查是否获胜
              if (mergedValue === WINNING_TILE) {
                setGameWon(true);
              }
            }
          }

          // 填充剩余位置
          while (row.length < GRID_SIZE) {
            row.push(0);
          }

          // 更新网格
          for (let j = 0; j < GRID_SIZE; j++) {
            if (newGrid[i][j] !== row[j]) {
              moved = true;
            }
            newGrid[i][j] = row[j];
          }
        }
        break;

      case 'right':
        for (let i = 0; i < GRID_SIZE; i++) {
          const row = [];
          for (let j = GRID_SIZE - 1; j >= 0; j--) {
            if (newGrid[i][j] !== 0) {
              row.push(newGrid[i][j]);
            }
          }

          // 合并相同数字
          for (let j = 0; j < row.length - 1; j++) {
            if (row[j] === row[j + 1]) {
              const mergedValue = row[j] * 2;
              row[j] = mergedValue;
              row.splice(j + 1, 1);
              newScore += mergedValue;
              
              // 记录合并位置（在新网格中的最终位置）
              mergedPositions.push({ row: i, col: GRID_SIZE - row.length + j, value: mergedValue });
              
              // 检查是否获胜
              if (mergedValue === WINNING_TILE) {
                setGameWon(true);
              }
            }
          }

          // 填充剩余位置
          while (row.length < GRID_SIZE) {
            row.push(0);
          }

          // 更新网格
          for (let j = GRID_SIZE - 1; j >= 0; j--) {
            if (newGrid[i][j] !== row[GRID_SIZE - 1 - j]) {
              moved = true;
            }
            newGrid[i][j] = row[GRID_SIZE - 1 - j];
          }
        }
        break;
    }

    // 如果有移动，则添加新方块并更新状态
    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);

      // 触发彩屑效果
      if (mergedPositions.length > 0) {
        // 清除之前的计时器
        Object.values(confettiTimersRef.current).forEach(timer => clearTimeout(timer));
        
        setConfetti({ positions: mergedPositions });
        
        // 1秒后清除彩屑（符合要求）
        const timer = setTimeout(() => {
          setConfetti(null);
          delete confettiTimersRef.current['main'];
        }, 1000);
        confettiTimersRef.current['main'] = timer;
      }

      // 检查游戏是否结束
      if (!canMove(newGrid)) {
        setGameOver(true);
        // 游戏结束时保存分数
        setTimeout(() => {
          saveScoreToHistory(newScore);
          // 保存分数到Supabase (仅非游客模式)
          if (!isGuest && user && newScore > 0) {
            saveScore(user.id, newScore).catch(error => {
              console.error('Failed to save score to Supabase:', error);
            });
          }
        }, 0);
      }
    }
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('right');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [grid, gameOver, gameWon, keepPlaying]);

  // 点击其他地方关闭退出按钮
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('img') && !event.target.closest('button')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 初始化游戏和加载分数历史
  useEffect(() => {
    loadScoreHistory();
    initGame();
  }, [initGame, loadScoreHistory]);

  // 获取方块颜色
  const getTileColor = (value) => {
    const colors = {
      0: 'bg-2048-empty-cell',
      2: 'bg-2048-tile-2',
      4: 'bg-2048-tile-4',
      8: 'bg-2048-tile-8',
      16: 'bg-2048-tile-16',
      32: 'bg-2048-tile-32',
      64: 'bg-2048-tile-64',
      128: 'bg-2048-tile-128',
      256: 'bg-2048-tile-256',
      512: 'bg-2048-tile-512',
      1024: 'bg-2048-tile-1024',
      2048: 'bg-2048-tile-2048',
    };
    
    // 对于更大的数字，使用更深的颜色
    if (value > 2048) {
      return 'bg-2048-tile-2048';
    }
    
    return colors[value] || 'bg-2048-tile-2';
  };

  // 获取方块文字颜色
  const getTileTextColor = (value) => {
    return value > 4 ? 'text-white' : 'text-gray-700';
  };

  // 继续游戏
  const handleKeepPlaying = () => {
    setKeepPlaying(true);
  };

  // 为每个方块生成唯一键值
  const getTileKey = (row, col, value) => {
    return `${row}-${col}-${value}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-2048-background p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-6xl font-bold text-gray-800">2048</h1>
              {(user || isGuest) && (
                <div className="flex items-center space-x-3 user-menu-container">
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={user ? signOut : signOutAsGuest}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <LogOut className="w-5 h-5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {user ? (
                      <motion.img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata.user_name}
                        className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                      />
                    ) : (
                      <motion.button
                        onClick={signIn}
                        className="w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Github className="w-5 h-5" />
                      </motion.button>
                    )}
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                      />
                    )}
                  </motion.div>
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-gray-600 text-lg mb-3">合并数字方块，达到2048！</p>
              <div className="flex items-center justify-between">
                <div 
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => setShowScoreHistory(true)}
                >
                  <div className="text-base">分数</div>
                  <div className="text-2xl">{score}</div>
                </div>
                <Button 
                  onClick={initGame} 
                  className="bg-gray-600 hover:bg-gray-700"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  重新开始
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 游戏结束提示卡片 */}
        {(gameOver || (gameWon && !keepPlaying)) && (
          <GameOverCard 
            gameOver={gameOver}
            gameWon={gameWon}
            onKeepPlaying={handleKeepPlaying}
            onRestart={initGame}
          />
        )}

        {/* 分数历史卡片 */}
        {showScoreHistory && (
          <ScoreHistoryCard 
            scores={scoreHistory}
            onClose={() => setShowScoreHistory(false)}
          />
        )}

        {/* 排行榜卡片 */}
        {showLeaderboard && (
          <LeaderboardCard 
            onClose={() => setShowLeaderboard(false)}
          />
        )}

        {/* 游戏网格 */}
        <div className="bg-[#FAF8EF] p-6 rounded-2048-md shadow-lg relative" ref={confettiContainerRef}>
          {/* 彩屑效果容器 */}
          {confetti && confetti.positions.map((position, index) => (
            <div 
              key={index}
              className="absolute"
              style={{
                left: `${24 + position.col * 88 + 44}px`,
                top: `${24 + position.row * 88 + 44}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <Confetti
                width={80}
                height={80}
                particleCount={30}
                particleSize={6}
                velocity={0.3}
                gravity={0.1}
                colors={['#FF5252', '#FFD740', '#40C4FF', '#69F0AE', '#FF4081']}
                duration={1000}
              />
            </div>
          ))}
          
          <div className="grid grid-cols-4 gap-4 bg-[#FAF8EF] p-4 rounded-2048-md">
            {grid.map((row, i) => 
              row.map((cell, j) => (
                <motion.div
                  key={getTileKey(i, j, cell)}
                  className={`
                    aspect-square flex items-center justify-center rounded-2048-md font-bold text-2xl
                    ${getTileColor(cell)} 
                    ${getTileTextColor(cell)}
                    ${cell === 0 ? 'bg-2048-empty-cell' : 'shadow-md'}
                  `}
                  initial={{ scale: cell === 0 ? 1 : 0.8 }}
                  animate={{ 
                    scale: 1,
                    transition: { 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15 
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cell !== 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: 1,
                        transition: { 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 10 
                        }
                      }}
                    >
                      {cell}
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* 排行榜按钮 */}
        {(user || isGuest) && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setShowLeaderboard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full"
              size="lg"
            >
              🏆 查看排行榜
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

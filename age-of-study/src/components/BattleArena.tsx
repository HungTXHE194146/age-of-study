'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Swords, 
  Heart, 
  Shield, 
  Clock,
  Trophy,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from './ProgressBar'

interface BattleArenaProps {
  player1Name: string
  player2Name: string
  onBattleEnd: (winner: string) => void
}

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

export function BattleArena({ player1Name, player2Name, onBattleEnd }: BattleArenaProps) {
  const [player1Health, setPlayer1Health] = useState(100)
  const [player2Health, setPlayer2Health] = useState(100)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [isAnswering, setIsAnswering] = useState(false)
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'completed'>('waiting')
  const [winner, setWinner] = useState<string | null>(null)

  // Sample questions
  const questions: Question[] = [
    {
      id: 'q1',
      text: '2 + 3 = ?',
      options: ['4', '5', '6', '7'],
      correctAnswer: 1
    },
    {
      id: 'q2',
      text: '5 - 2 = ?',
      options: ['2', '3', '4', '5'],
      correctAnswer: 1
    },
    {
      id: 'q3',
      text: 'Số nào lớn hơn 7?',
      options: ['5', '6', '7', '8'],
      correctAnswer: 3
    }
  ]

  const loadNextQuestion = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    setCurrentQuestion(randomQuestion)
    setTimeLeft(10)
    setIsAnswering(false)
  }

  useEffect(() => {
    if (gameState === 'active' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameState === 'active') {
      // Time's up, damage both players
      setTimeout(() => {
        setPlayer1Health(prev => Math.max(0, prev - 10))
        setPlayer2Health(prev => Math.max(0, prev - 10))
        loadNextQuestion()
      }, 0)
    }
  }, [timeLeft, gameState])

  useEffect(() => {
    if (player1Health <= 0 || player2Health <= 0) {
      setTimeout(() => {
        setGameState('completed')
        const winnerName = player1Health <= 0 ? player2Name : player1Name
        setWinner(winnerName)
        onBattleEnd(winnerName)
      }, 0)
    }
  }, [player1Health, player2Health, player1Name, player2Name, onBattleEnd])

  const startBattle = () => {
    setGameState('active')
    loadNextQuestion()
  }

  const handleAnswer = (answerIndex: number) => {
    if (isAnswering || gameState !== 'active') return
    
    setIsAnswering(true)
    
    if (currentQuestion && answerIndex === currentQuestion.correctAnswer) {
      // Correct answer - damage opponent
      setPlayer2Health(prev => Math.max(0, prev - 20))
    } else {
      // Wrong answer - take damage
      setPlayer1Health(prev => Math.max(0, prev - 15))
    }
    
    // Wait a moment then show next question
    setTimeout(() => {
      loadNextQuestion()
    }, 1000)
  }

  if (gameState === 'completed' && winner) {
    return (
      <div className="card text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-6"
        >
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {winner} Chiến Thắng!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Đã giành chiến thắng trong trận chiến kiến thức
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-semibold">{winner}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Người chiến thắng</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl mb-2">😢</div>
            <div className="font-semibold">
              {winner === player1Name ? player2Name : player1Name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Thất bại</div>
          </div>
        </div>
        
        <Button onClick={() => window.location.reload()} className="btn-primary">
          Chơi lại
        </Button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trận Chiến Kiến Thức
        </h2>
        <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-gray-300">
          <Users className="w-5 h-5" />
          <span>{player1Name} vs {player2Name}</span>
        </div>
      </div>

      {/* Health Bars */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{player1Name}</span>
          </div>
          <ProgressBar 
            current={player1Health} 
            target={100} 
            label="Máu"
            color="red"
          />
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">{player2Name}</span>
          </div>
          <ProgressBar 
            current={player2Health} 
            target={100} 
            label="Máu"
            color="blue"
          />
        </div>
      </div>

      {/* Game Area */}
      {gameState === 'waiting' ? (
        <div className="text-center">
          <div className="mb-6">
            <Swords className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Sẵn sàng cho trận chiến kiến thức?
            </p>
          </div>
          <Button onClick={startBattle} className="btn-primary text-lg px-8 py-3">
            Bắt đầu Trận Chiến
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timer */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="font-mono text-lg font-bold text-orange-600">
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                {currentQuestion.text}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={isAnswering}
                    className={`p-4 text-left text-base ${
                      isAnswering 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-white/80 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="text-center text-gray-600 dark:text-gray-300">
            {isAnswering ? 'Đang xử lý...' : 'Hãy trả lời nhanh để giảm máu đối thủ!'}
          </div>
        </div>
      )}
    </div>
  )
}
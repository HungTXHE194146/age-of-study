'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  current: number
  target: number
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'green' | 'blue' | 'red'
}

export function ProgressBar({ 
  current, 
  target, 
  label, 
  showPercentage = true,
  color = 'primary'
}: ProgressBarProps) {
  const percentage = Math.min(100, (current / target) * 100)
  
  const getColorClass = () => {
    switch (color) {
      case 'green': return 'bg-green-500'
      case 'blue': return 'bg-blue-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-primary-600'
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          <span>{label}</span>
          {showPercentage && (
            <span className="text-primary-600 font-bold">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div className="progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`progress-fill ${getColorClass()}`}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{current} điểm</span>
        <span>{target} điểm cần thiết</span>
      </div>
    </div>
  )
}

interface PointsDisplayProps {
  points: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PointsDisplay({ points, label = 'Điểm', size = 'md' }: PointsDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  return (
    <div className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl">
      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-2xl">⭐</span>
      </div>
      <div>
        <div className="text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wide font-semibold">
          {label}
        </div>
        <div className={`font-bold text-gray-900 dark:text-white ${sizeClasses[size as keyof typeof sizeClasses]}`}>
          {points.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
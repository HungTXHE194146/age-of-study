'use client'

import { motion } from 'framer-motion'
import { Lock, CheckCircle, Star } from 'lucide-react'
import { type Node } from '@/lib/supabase'

interface SkillNodeProps {
  node: Node
  isUnlocked: boolean
  isCompleted: boolean
  currentPoints: number
  onNodeClick: (node: Node) => void
}

export function SkillNode({ 
  node, 
  isUnlocked, 
  isCompleted, 
  currentPoints, 
  onNodeClick 
}: SkillNodeProps) {
  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'math': return 'bg-red-500'
      case 'english': return 'bg-blue-500'
      case 'vietnamese': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'math': return '🔢'
      case 'english': return '🇬🇧'
      case 'vietnamese': return '🇻🇳'
      default: return '📚'
    }
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="relative"
    >
      {/* Connection line to next node */}
      {node.order < 6 && (
        <div className="absolute left-1/2 top-16 w-0.5 h-8 bg-gray-300 dark:bg-gray-600 transform -translate-x-1/2" />
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNodeClick(node)}
        disabled={!isUnlocked}
        className={`skill-node ${getSubjectColor(node.subject)} relative group ${
          !isUnlocked ? 'locked' : ''
        } ${isCompleted ? 'completed' : ''}`}
        style={{
          boxShadow: isCompleted 
            ? '0 0 0 4px rgba(34, 197, 94, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Subject Icon */}
        <span className="text-white text-lg font-bold">
          {getSubjectIcon(node.subject)}
        </span>

        {/* Lock Icon for locked nodes */}
        {!isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg"
          >
            <Lock className="w-4 h-4 text-gray-600" />
          </motion.div>
        )}

        {/* Completion Checkmark */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
          >
            <CheckCircle className="w-5 h-5 text-white" />
          </motion.div>
        )}

        {/* Required Points Tooltip */}
        {!isUnlocked && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Cần {node.required_points} điểm
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </motion.button>

      {/* Node Label */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {node.title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          +{node.required_points} điểm
        </div>
      </div>

      {/* Progress Ring for current node */}
      {isUnlocked && !isCompleted && (
        <motion.div
          initial={{ rotate: -90 }}
          animate={{ rotate: 0 }}
          className="absolute -inset-2 rounded-full border-2 border-gray-200 dark:border-gray-700"
        >
          <div 
            className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-primary-500"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${Math.min(100, (currentPoints / node.required_points) * 100)}% 0%, ${Math.min(100, (currentPoints / node.required_points) * 100)}% 100%, 50% 100%)`
            }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
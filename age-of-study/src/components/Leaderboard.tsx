'use client'

import { useState } from 'react'
import { 
  Trophy,
  Users,
  BarChart3,
  Filter,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LeaderboardEntry {
  rank: number
  username: string
  total_points: number
  subject?: string
}

const mockLeaderboardData: LeaderboardEntry[] = [
  { rank: 1, username: 'NguyenVanA', total_points: 150, subject: 'math' },
  { rank: 2, username: 'TranThiB', total_points: 120, subject: 'english' },
  { rank: 3, username: 'LeVanC', total_points: 100, subject: 'vietnamese' },
  { rank: 4, username: 'PhamThiD', total_points: 85, subject: 'math' },
  { rank: 5, username: 'HoangVanE', total_points: 75, subject: 'english' },
  { rank: 6, username: 'DangThiF', total_points: 65, subject: 'vietnamese' },
  { rank: 7, username: 'VuVanG', total_points: 55, subject: 'math' },
  { rank: 8, username: 'NgoThiH', total_points: 45, subject: 'english' },
  { rank: 9, username: 'BuiVanI', total_points: 35, subject: 'vietnamese' },
  { rank: 10, username: 'DoThiK', total_points: 25, subject: 'math' }
]

export function Leaderboard() {
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'math' | 'english' | 'vietnamese'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = mockLeaderboardData.filter(entry => {
    const matchesSubject = selectedSubject === 'all' || entry.subject === selectedSubject
    const matchesSearch = entry.username.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSubject && matchesSearch
  })

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500'
      case 2: return 'text-gray-400'
      case 3: return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return rank
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng Xếp Hạng</h2>
            <p className="text-gray-600 dark:text-gray-300">Top học sinh xuất sắc</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Thống kê
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value as 'all' | 'math' | 'english' | 'vietnamese')}
            className="bg-transparent border-none outline-none text-sm"
          >
            <option value="all">Tất cả môn học</option>
            <option value="math">Toán Học</option>
            <option value="english">Tiếng Anh</option>
            <option value="vietnamese">Tiếng Việt</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none flex-1 text-sm"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-200 text-sm">
          <div>Hạng</div>
          <div>Học sinh</div>
          <div>Môn học</div>
          <div>Điểm số</div>
          <div>Tỷ lệ</div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredData.map((entry) => (
            <div key={entry.rank} className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className={`font-bold text-lg ${getMedalColor(entry.rank)}`}>
                {getMedalIcon(entry.rank)}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{entry.username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Học sinh</div>
                </div>
              </div>
              
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  entry.subject === 'math' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  entry.subject === 'english' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {entry.subject === 'math' && '🔢 Toán'}
                  {entry.subject === 'english' && '🇬🇧 Anh'}
                  {entry.subject === 'vietnamese' && '🇻🇳 Việt'}
                </span>
              </div>
              
              <div className="font-bold text-gray-900 dark:text-white">
                {entry.total_points.toLocaleString()} điểm
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${(entry.total_points / 150) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round((entry.total_points / 150) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-semibold text-gray-900 dark:text-white">Người dẫn đầu</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {mockLeaderboardData[0]?.username} - {mockLeaderboardData[0]?.total_points} điểm
          </div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-2xl mb-2">👥</div>
          <div className="font-semibold text-gray-900 dark:text-white">Tổng học sinh</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {mockLeaderboardData.length} người tham gia
          </div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
          <div className="text-2xl mb-2">📈</div>
          <div className="font-semibold text-gray-900 dark:text-white">Điểm trung bình</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {Math.round(mockLeaderboardData.reduce((acc, curr) => acc + curr.total_points, 0) / mockLeaderboardData.length)} điểm
          </div>
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Users,
  Trophy,
  Brain,
  Globe,
  GraduationCap
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mới ra mắt
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          ageOfStudy{' '}
          <span className="text-primary-600">Vietnam</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Nền tảng học tập gamified dành cho học sinh tiểu học Việt Nam.
          Học Toán, Tiếng Anh, và Tiếng Việt thông qua các skill tree hấp dẫn
          và các trận chiến kiến thức thú vị.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="btn-primary text-lg px-8">
              Bắt đầu học ngay
            </Button>
          </Link>
          <Link href="/battle">
            <Button size="lg" variant="outline" className="btn-secondary text-lg px-8">
              Thách đấu bạn bè
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Skill Tree Thông Minh</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Hệ thống cây kỹ năng phân nhánh giúp học sinh phát triển toàn diện
            qua các môn Toán, Tiếng Anh, và Tiếng Việt.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Trận Chiến Kiến Thức</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Thi đấu trực tiếp với bạn bè, trả lời nhanh để giảm máu đối thủ
            và giành chiến thắng.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Bảng Xếp Hạng</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Theo dõi tiến độ và so tài với các học sinh khác trên toàn quốc.
          </p>
        </div>
      </div>

      {/* Subjects Showcase */}
      <div className="card">
        <h2 className="text-3xl font-bold text-center mb-8">Các Môn Học</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔢</span>
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-2">Toán Học</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Rèn luyện tư duy logic, giải toán nhanh và chính xác
            </p>
          </div>

          <div className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇬🇧</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mb-2">Tiếng Anh</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Phát triển kỹ năng nghe, nói, đọc, viết Tiếng Anh
            </p>
          </div>

          <div className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇻🇳</span>
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Tiếng Việt</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Nâng cao kỹ năng đọc hiểu, chính tả và văn học
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

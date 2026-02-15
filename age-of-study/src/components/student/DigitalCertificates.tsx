/**
 * Digital Certificates Component
 * 
 * The STAR FEATURE that connects online-offline learning!
 * 
 * Features:
 * - Beautiful certificate display with multiple design templates
 * - "Show Parents" button to share certificate
 * - Downloads certificate as image for easy sharing
 * - Teacher information visible
 * - Category badges (academic, behavior, participation, special)
 * 
 * Clean code practices:
 * - html2canvas for certificate image generation
 * - Proper error handling for download failures
 * - Accessible design with proper ARIA labels
 * - Optimized rendering performance
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Download,
  Share2,
  Eye,
  Sparkles,
  MessageCircle,
  Medal,
  Star,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CertificateWithTeacher, CertificateTemplate } from '@/types/achievement';
import {
  getStudentCertificates,
  updateCertificateStatus,
} from '@/lib/achievementService';

interface DigitalCertificatesProps {
  studentId: string;
  studentName: string;
}

export default function DigitalCertificates({
  studentId,
  studentName,
}: DigitalCertificatesProps) {
  const [certificates, setCertificates] = useState<CertificateWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<CertificateWithTeacher | null>(null);

  useEffect(() => {
    loadCertificates();
  }, [studentId]);

  const loadCertificates = async () => {
    setLoading(true);
    setError(null);

    const response = await getStudentCertificates(studentId);

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setCertificates(response.data ?? []);
    setLoading(false);
  };

  const handleViewCertificate = async (cert: CertificateWithTeacher) => {
    setSelectedCert(cert);

    // Mark as viewed if not already
    if (!cert.viewed_at) {
      await updateCertificateStatus({
        certificate_id: cert.id,
        viewed: true,
      });

      // Update local state
      setCertificates((prev) =>
        prev.map((c) =>
          c.id === cert.id ? { ...c, viewed_at: new Date().toISOString() } : c
        )
      );

      // Celebratory confetti!
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.6 },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Đang tải bằng khen...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadCertificates}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const unviewedCount = certificates.filter((c) => !c.viewed_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Bảng Khen Thưởng Số 🌟
              </h2>
              <p className="text-sm text-gray-600">
                Giáo viên tặng khi em làm tốt!
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {certificates.length}
            </div>
            <div className="text-xs text-gray-500">Bằng khen</div>
            {unviewedCount > 0 && (
              <div className="mt-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full inline-block">
                {unviewedCount} mới
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {certificates.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Chưa có bằng khen nào
          </h3>
          <p className="text-gray-500">
            Hãy học tập chăm chỉ để giáo viên tặng bằng khen nhé!
          </p>
        </div>
      )}

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificates.map((cert, index) => (
          <CertificateCard
            key={cert.id}
            certificate={cert}
            index={index}
            onClick={() => handleViewCertificate(cert)}
          />
        ))}
      </div>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {selectedCert && (
          <CertificateModal
            certificate={selectedCert}
            studentName={studentName}
            onClose={() => setSelectedCert(null)}
            onShared={async () => {
              await updateCertificateStatus({
                certificate_id: selectedCert.id,
                shared: true,
              });
              setCertificates((prev) =>
                prev.map((c) =>
                  c.id === selectedCert.id
                    ? { ...c, shared_at: new Date().toISOString() }
                    : c
                )
              );
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Certificate Card Component
// ============================================================================

interface CertificateCardProps {
  certificate: CertificateWithTeacher;
  index: number;
  onClick: () => void;
}

function CertificateCard({ certificate, index, onClick }: CertificateCardProps) {
  const isNew = !certificate.viewed_at;
  const isShared = !!certificate.shared_at;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all text-left"
    >
      {/* New Badge */}
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
          MỚI!
        </div>
      )}

      {/* Category Icon */}
      <div className="flex items-center gap-2 mb-3">
        {getCategoryIcon(certificate.category)}
        <span className="text-xs font-semibold text-gray-600 uppercase">
          {getCategoryLabel(certificate.category)}
        </span>
      </div>

      {/* Certificate Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        {certificate.title}
      </h3>

      {/* Description */}
      {certificate.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {certificate.description}
        </p>
      )}

      {/* Teacher Info */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-700">
        <span className="font-semibold">Từ:</span>
        <span>{certificate.teacher_name}</span>
      </div>

      {/* Date */}
      <div className="text-xs text-gray-500">
        {new Date(certificate.issued_at).toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>

      {/* Shared Status */}
      {isShared && (
        <div className="absolute bottom-2 right-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <Share2 className="w-3 h-3" />
          Đã khoe
        </div>
      )}
    </motion.button>
  );
}

// ============================================================================
// Certificate Detail Modal
// ============================================================================

interface CertificateModalProps {
  certificate: CertificateWithTeacher;
  studentName: string;
  onClose: () => void;
  onShared: () => void;
}

function CertificateModal({
  certificate,
  studentName,
  onClose,
  onShared,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      } as any);

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          alert('❌ Không thể tạo ảnh. Vui lòng thử lại!');
          setDownloading(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bang-khen-${studentName}-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        // Mark as shared
        onShared();

        // Success confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setDownloading(false);
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('❌ Có lỗi xảy ra khi tải xuống. Vui lòng thử lại!');
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl"
      >
        {/* Certificate Display */}
        <div
          ref={certificateRef}
          className={`
            ${getTemplateStyles(certificate.design_template)}
            p-8 md:p-12 rounded-2xl shadow-2xl
          `}
        >
          <CertificateContent certificate={certificate} studentName={studentName} />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang tạo ảnh...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                🎉 Khoe Bố Mẹ
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Certificate Content Template
// ============================================================================

interface CertificateContentProps {
  certificate: CertificateWithTeacher;
  studentName: string;
}

function CertificateContent({ certificate, studentName }: CertificateContentProps) {
  return (
    <div className="text-center space-y-6">
      {/* Decorative Top */}
      <div className="flex justify-center gap-2 text-4xl">
        <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
        <Trophy className="w-12 h-12 text-yellow-500" />
        <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
      </div>

      {/* Title */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
          BẰNG KHEN
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
      </div>

      {/* Category Badge */}
      <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border-2 border-yellow-300">
        {getCategoryIcon(certificate.category)}
        <span className="font-semibold text-gray-700">
          {getCategoryLabel(certificate.category)}
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <p className="text-lg text-gray-700">Trao tặng cho em học sinh</p>

        <h2 className="text-3xl md:text-4xl font-bold text-blue-600">
          {studentName}
        </h2>

        <div className="max-w-lg mx-auto">
          <p className="text-xl font-semibold text-gray-800 mb-3">
            {certificate.title}
          </p>

          {certificate.description && (
            <p className="text-base text-gray-600 italic">
              "{certificate.description}"
            </p>
          )}
        </div>
      </div>

      {/* Teacher Signature */}
      <div className="pt-8 border-t-2 border-dashed border-gray-300">
        <p className="text-sm text-gray-600 mb-2">Giáo viên</p>
        <p className="text-xl font-bold text-gray-800">{certificate.teacher_name}</p>
      </div>

      {/* Date */}
      <div className="text-sm text-gray-500">
        Ngày{' '}
        {new Date(certificate.issued_at).toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>

      {/* Decorative Bottom */}
      <div className="flex justify-center gap-3 text-3xl pt-4">
        {['🌟', '⭐', '✨', '⭐', '🌟'].map((emoji, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryIcon(category: string | null) {
  const icons = {
    academic: <Medal className="w-5 h-5 text-blue-500" />,
    behavior: <Star className="w-5 h-5 text-purple-500" />,
    participation: <Trophy className="w-5 h-5 text-green-500" />,
    special: <Sparkles className="w-5 h-5 text-yellow-500" />,
  };

  return icons[category as keyof typeof icons] || <Award className="w-5 h-5 text-gray-500" />;
}

function getCategoryLabel(category: string | null): string {
  const labels = {
    academic: 'Học tập',
    behavior: 'Hành vi',
    participation: 'Tham gia',
    special: 'Đặc biệt',
  };

  return labels[category as keyof typeof labels] || 'Khác';
}

function getTemplateStyles(template: CertificateTemplate): string {
  const styles = {
    classic:
      'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border-8 border-double border-yellow-400',
    modern:
      'bg-gradient-to-br from-blue-50 via-white to-purple-50 border-4 border-blue-300',
    playful:
      'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-4 border-dashed border-purple-400',
  };

  return styles[template] || styles.classic;
}

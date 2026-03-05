import { Metadata } from "next";
import { StepCard } from "@/components/ui/step-card";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { Smartphone, ScanLine, KeyRound, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Hướng dẫn cài đặt Xác thực 2 bước (2FA) | Hệ thống học tập",
  description:
    "Bảo vệ tài khoản của bạn với tính năng Xác thực 2 bước bằng ứng dụng Authenticator.",
};

export default function TwoFactorAuthGuidePage() {
  const faqItems = [
    {
      question: "Tôi bị mất điện thoại, làm sao để đăng nhập?",
      answer:
        "Trong quá trình cài đặt, bạn nên lưu lại Mã phục hồi (Recovery Code) ở một nơi an toàn. Dùng mã đó để đăng nhập nếu mất điện thoại. Nếu bạn chưa lưu mã phục hồi, vui lòng liên hệ Ban quản trị để được hỗ trợ cấp lại quyền truy cập.",
    },
    {
      question: "Vì sao thiết bị báo mã xác thực không hợp lệ?",
      answer:
        "Thường do đồng hồ trên điện thoại của bạn không đồng bộ chính xác với hệ thống. Hãy vào phần Cài đặt của ứng dụng Authenticator và chọn 'Đồng bộ thời gian'.",
    },
    {
      question:
        "Tôi có thể dùng ứng dụng khác ngoài Google Authenticator không?",
      answer:
        "Có, bạn hoàn toàn có thể sử dụng Microsoft Authenticator, Authy, hoặc tính năng Password Manager tích hợp sẵn trên iOS/Android để quét mã QR và lưu mã 2FA.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6">
      <header className="mb-20">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]">
          BẢO MẬT <br /> <span className="text-gray-500">TÀI KHOẢN.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl font-light leading-relaxed">
          Xác thực 2 bước (2FA) thêm một lớp bảo vệ vững chắc cho tài khoản của
          bạn. Cài đặt chỉ mất{" "}
          <strong className="text-white font-bold">2 phút</strong>.
        </p>
      </header>

      <div className="space-y-6 mb-32 relative z-10">
        <StepCard
          stepNumber={1}
          icon={<Smartphone />}
          title="Tải ứng dụng Authenticator"
          description="Bạn cần một ứng dụng tạo mã xác thực (TOTP) trên điện thoại di động. Chúng tôi khuyến nghị sử dụng Google Authenticator hoặc Microsoft Authenticator."
        >
          <div className="flex gap-4">
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-colors font-semibold tracking-wide"
            >
              CH PLAY (ANDROID)
            </a>
            <a
              href="https://apps.apple.com/us/app/google-authenticator/id388497605"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-colors font-semibold tracking-wide"
            >
              APP STORE (iOS)
            </a>
          </div>
        </StepCard>

        <StepCard
          stepNumber={2}
          icon={<ScanLine />}
          title="Bật 2FA & Quét mã QR"
          description="Vào trang Cài đặt (Settings) trên hệ thống -> Chọn mục 'Bảo mật'. Nhấn nút 'Bật 2FA'. Hệ thống sẽ hiển thị một mã QR khổng lồ trên màn hình. Mở ứng dụng Authenticator vừa tải và quét mã QR này."
        >
          <div className="bg-black/50 border border-white/10 p-4 text-sm text-gray-400 font-mono tracking-tight">
            Lưu ý: Nếu không thể quét QR, bạn có thể nhập dòng mã bí mật (Secret
            Code) hiển thị bên dưới mã QR.
          </div>
        </StepCard>

        <StepCard
          stepNumber={3}
          icon={<KeyRound />}
          title="Nhập mã xác nhận"
          description="Sau khi quét mã, ứng dụng trên điện thoại sẽ tạo ra 6 chữ số (thay đổi mỗi 30 giây). Nhập 6 chữ số này vào ô xác nhận trên website để hoàn tất liên kết."
        />
      </div>

      <section className="border-t border-white/20 pt-20 mb-32">
        <div className="flex items-center gap-4 mb-10">
          <ShieldAlert className="w-8 h-8 text-white" />
          <h2 className="text-4xl font-black tracking-tight">
            CÂU HỎI THƯỜNG GẶP
          </h2>
        </div>
        <FAQAccordion items={faqItems} />
      </section>
    </div>
  );
}

/**
 * Manual curriculum structure for SGK Tiếng Việt 5 - Tập 1 - KNTT
 * 
 * To populate this file:
 * 1. Open https://loigiaihay.com/tieng-viet-5-ket-noi-tri-thuc-c1786.html
 * 2. In DevTools Console, run this script to extract URLs:
 * 
 * ```javascript
 * const weeks = []
 * document.querySelectorAll('a.show-child1').forEach((weekLink, i) => {
 *   const weekText = weekLink.innerText.trim()
 *   const lessons = []
 *   weekLink.closest('li').querySelectorAll('a.show-child2').forEach(lessonLink => {
 *     lessons.push({
 *       title: lessonLink.innerText.trim(),
 *       url: lessonLink.href
 *     })
 *   })
 *   weeks.push({ week: i + 1, theme: weekText, lessons })
 * })
 * console.log(JSON.stringify(weeks, null, 2))
 * ```
 * 
 * 3. Copy output and paste below
 */

export interface LessonLink {
  title: string
  url: string
}

export interface WeekStructure {
  week: number
  theme: string
  lessons: LessonLink[]
}

// TODO: Replace with actual URLs from website
export const CURRICULUM: WeekStructure[] = [
  {
    "week": 1,
    "theme": "Tuần 1: Thế giới tuổi thơ",
    "lessons": [
      {
        "title": "Bài 1: Thanh âm của gió",
        "url": "https://loigiaihay.com/bai-1-thanh-am-cua-gio-trang-8-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158681.html"
      },
      {
        "title": "Bài 1: Luyện tập về danh từ, động từ, tính từ",
        "url": "https://loigiaihay.com/bai-1-luyen-tap-ve-danh-tu-dong-tu-tinh-tu-trang-10-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158690.html"
      },
      {
        "title": "Bài 1: Tìm hiểu cách viết bài văn kể chuyện sáng tạo",
        "url": "https://loigiaihay.com/bai-1-tim-hieu-cach-viet-bai-van-ke-chuyen-sang-tao-trang-11-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158691.html"
      },
      {
        "title": "Bài 2: Cánh đồng hoa",
        "url": "https://loigiaihay.com/bai-2-canh-dong-hoa-trang-13-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158694.html"
      },
      {
        "title": "Bài 2: Tìm hiểu cách viết bài văn kể chuyện sáng tạo (tiếp theo)",
        "url": "https://loigiaihay.com/bai-2-tim-hieu-cach-viet-bai-van-ke-chuyen-sang-tao-tiep-theo-trang-15-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158696.html"
      },
      {
        "title": "Bài 2: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-2-doc-mo-rong-trang-17-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158697.html"
      }
    ]
  },
  {
    "week": 2,
    "theme": "Tuần 2: Thế giới tuổi thơ",
    "lessons": [
      {
        "title": "Bài 3: Tuổi ngựa",
        "url": "https://loigiaihay.com/bai-3-tuoi-ngua-trang-18-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158698.html"
      },
      {
        "title": "Bài 3: Đại từ",
        "url": "https://loigiaihay.com/bai-3-dai-tu-trang-20-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158700.html"
      },
      {
        "title": "Bài 3: Lập dàn ý cho bài văn kể chuyện sáng tạo",
        "url": "https://loigiaihay.com/bai-3-lap-dan-y-cho-bai-van-ke-chuyen-sang-tao-trang-21-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158747.html"
      },
      {
        "title": "Bài 4: Bến sông tuổi thơ",
        "url": "https://loigiaihay.com/bai-4-ben-song-tuoi-tho-trang-23-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158755.html"
      },
      {
        "title": "Bài 4: Viết bài văn kể chuyện sáng tạo",
        "url": "https://loigiaihay.com/bai-4-viet-bai-van-ke-chuyen-sang-tao-trang-25-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158758.html"
      },
      {
        "title": "Bài 4: Những câu chuyện thú vị",
        "url": "https://loigiaihay.com/bai-4-nhung-cau-chuyen-thu-vi-trang-26-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a158759.html"
      }
    ]
  },
  {
    "week": 3,
    "theme": "Tuần 3: Thế giới tuổi thơ",
    "lessons": [
      {
        "title": "Bài 5: Tiếng hạt nảy mầm",
        "url": "https://loigiaihay.com/bai-5-tieng-hat-nay-mam-trang-28-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162430.html"
      },
      {
        "title": "Bài 5: Luyện tập về đại từ",
        "url": "https://loigiaihay.com/bai-5-luyen-tap-ve-dai-tu-trang-29-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162431.html"
      },
      {
        "title": "Bài 5: Đánh giá, chỉnh sửa bài văn kể chuyện sáng tạo",
        "url": "https://loigiaihay.com/bai-5-danh-gia-chinh-sua-bai-van-ke-chuyen-sang-tao-trang-30-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162432.html"
      },
      {
        "title": "Bài 6: Ngôi sao sân cỏ",
        "url": "https://loigiaihay.com/bai-6-ngoi-sao-san-co-trang-31-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162433.html"
      },
      {
        "title": "Bài 6: Tìm hiểu cách viết báo cáo công việc",
        "url": "https://loigiaihay.com/bai-6-tim-hieu-cach-viet-bao-cao-cong-viec-trang-33-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162434.html"
      },
      {
        "title": "Bài 6: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-6-doc-mo-rong-trang-35-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162435.html"
      }
    ]
  },
  {
    "week": 4,
    "theme": "Tuần 4: Thế giới tuổi thơ",
    "lessons": [
      {
        "title": "Bài 7: Bộ sưu tập độc đáo",
        "url": "https://loigiaihay.com/bai-7-bo-suu-tap-doc-dao-trang-36-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162436.html"
      },
      {
        "title": "Bài 7: Luyện tập về đại từ (Tiếp theo)",
        "url": "https://loigiaihay.com/bai-7-luyen-tap-ve-dai-tu-tiep-theo-trang-38-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162438.html"
      },
      {
        "title": "Bài 7: Viết báo cáo công việc",
        "url": "https://loigiaihay.com/bai-7-viet-bao-cao-cong-viec-trang-39-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162439.html"
      },
      {
        "title": "Bài 8: Hành tinh kì lạ",
        "url": "https://loigiaihay.com/bai-8-hanh-tinh-ki-la-trang-41-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162441.html"
      },
      {
        "title": "Bài 8: Đánh giá, chỉnh sửa báo cáo công việc",
        "url": "https://loigiaihay.com/bai-8-danh-gia-chinh-sua-bao-cao-cong-viec-trang-43-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162442.html"
      },
      {
        "title": "Bài 8: Những điểm vui chơi lí thú",
        "url": "https://loigiaihay.com/bai-8-nhung-diem-vui-choi-li-thu-trang-44-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162444.html"
      }
    ]
  },
  {
    "week": 5,
    "theme": "Tuần 5: Thiên nhiên kì thú",
    "lessons": [
      {
        "title": "Bài 9: Trước cổng trời",
        "url": "https://loigiaihay.com/bai-9-truoc-cong-troi-trang-46-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162447.html"
      },
      {
        "title": "Bài 9: Từ đồng nghĩa",
        "url": "https://loigiaihay.com/bai-9-tu-dong-nghia-trang-47-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162448.html"
      },
      {
        "title": "Bài 9: Tìm hiểu cách viết bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-9-tim-hieu-cach-viet-bai-van-ta-phong-canh-trang-49-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162449.html"
      },
      {
        "title": "Bài 10: Kì diệu rừng xanh",
        "url": "https://loigiaihay.com/bai-10-ki-dieu-rung-xanh-trang-51-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162451.html"
      },
      {
        "title": "Bài 10: Tìm hiểu cách viết bài văn tả phong cảnh (Tiếp theo)",
        "url": "https://loigiaihay.com/bai-10-tim-hieu-cach-viet-bai-van-ta-phong-canh-tiep-theo-trang-53-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162453.html"
      },
      {
        "title": "Bài 10: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-10-doc-mo-rong-trang-54-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162454.html"
      }
    ]
  },
  {
    "week": 6,
    "theme": "Tuần 6: Thiên nhiên kì thú",
    "lessons": [
      {
        "title": "Bài 11: Hang Sơn Đoòng - Những điều kì thú",
        "url": "https://loigiaihay.com/bai-11-hang-son-doong-nhung-dieu-ki-thu-trang-56-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162609.html"
      },
      {
        "title": "Bài 11: Luyện tập về từ đồng nghĩa",
        "url": "https://loigiaihay.com/bai-11-luyen-tap-ve-tu-dong-nghia-trang-58-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162610.html"
      },
      {
        "title": "Bài 11: Viết mở bài và kết bài cho bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-11-viet-mo-bai-va-ket-bai-cho-bai-van-ta-phong-canh-trang-59-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162611.html"
      },
      {
        "title": "Bài 12: Những hòn đảo trên Vịnh Hạ Long",
        "url": "https://loigiaihay.com/bai-12-nhung-hon-dao-tren-vinh-ha-long-trang-60-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162612.html"
      },
      {
        "title": "Bài 12: Quan sát phong cảnh",
        "url": "https://loigiaihay.com/bai-12-quan-sat-phong-canh-trang-61-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162613.html"
      },
      {
        "title": "Bài 12: Bảo tồn động vật hoang dã",
        "url": "https://loigiaihay.com/bai-12-bao-ton-dong-vat-hoang-da-trang-63-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162614.html"
      }
    ]
  },
  {
    "week": 7,
    "theme": "Tuần 7: Thiên nhiên kì thú",
    "lessons": [
      {
        "title": "Bài 13: Mầm non",
        "url": "https://loigiaihay.com/bai-13-mam-non-trang-64-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162628.html"
      },
      {
        "title": "Bài 13: Từ đa nghĩa",
        "url": "https://loigiaihay.com/bai-13-tu-da-nghia-trang-65-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162630.html"
      },
      {
        "title": "Bài 13: Lập dàn ý cho bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-13-lap-dan-y-cho-bai-van-ta-phong-canh-trang-67-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162633.html"
      },
      {
        "title": "Bài 14: Những ngọn núi nóng rẫy",
        "url": "https://loigiaihay.com/bai-14-nhung-ngon-nui-nong-ray-trang-68-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162635.html"
      },
      {
        "title": "Bài 14: Viết đoạn văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-14-viet-doan-van-ta-phong-canh-trang-70-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162636.html"
      },
      {
        "title": "Bài 14: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-14-doc-mo-rong-trang-71-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162640.html"
      }
    ]
  },
  {
    "week": 8,
    "theme": "Tuần 8: Thiên nhiên kì thú",
    "lessons": [
      {
        "title": "Bài 15: Bài ca về mặt trời",
        "url": "https://loigiaihay.com/bai-15-bai-ca-ve-mat-troi-trang-72-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162871.html"
      },
      {
        "title": "Bài 15: Luyện tập về từ đa nghĩa",
        "url": "https://loigiaihay.com/bai-15-luyen-tap-ve-tu-da-nghia-trang-74-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162872.html"
      },
      {
        "title": "Bài 15: Viết bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-15-viet-bai-van-ta-phong-canh-trang-75-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162873.html"
      },
      {
        "title": "Bài 16: Xin chào, Xa-ha-ra",
        "url": "https://loigiaihay.com/bai-16-xin-chao-xa-ha-ra-trang-76-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162874.html"
      },
      {
        "title": "Bài 16: Đánh giá, chỉnh sửa bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-16-danh-gia-chinh-sua-bai-van-ta-phong-canh-trang-78-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162875.html"
      },
      {
        "title": "Bài 16: Cảnh đẹp thiên nhiên",
        "url": "https://loigiaihay.com/bai-16-canh-dep-thien-nhien-trang-79-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162876.html"
      }
    ]
  },
  {
    "week": 9,
    "theme": "Tuần 9: Ôn tập và Đánh giá giữa học kì 1",
    "lessons": [
      {
        "title": "Phần 1 - Ôn tập: Tiết 1 - 2",
        "url": "https://loigiaihay.com/phan-i-on-tap-tiet-12-trang-80-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162877.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 3 - 4",
        "url": "https://loigiaihay.com/phan-i-on-tap-tiet-34-trang-82-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162878.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 5",
        "url": "https://loigiaihay.com/phan-i-on-tap-tiet-5-trang-83-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162879.html"
      },
      {
        "title": "Phần 2 - Đánh giá giữa học kì I: Tiết 6 - 7: Vườn mặt trời, quả mặt trăng",
        "url": "https://loigiaihay.com/phan-2-danh-gia-giua-hoc-ki-i-tiet-6-7-vuon-mat-troi-qua-mat-trang-trang-85-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162880.html"
      },
      {
        "title": "Phần 2 - Đánh giá giữa học kì I: Tiết 6 - 7: Cánh đồng vàng",
        "url": "https://loigiaihay.com/phan-2-danh-gia-giua-hoc-ki-i-tiet-6-7-canh-dong-vang-trang-86-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162881.html"
      },
      {
        "title": "Phần 2 - Đánh giá giữa học kì I: Tiết 6 - 7: Viết",
        "url": "https://loigiaihay.com/phan-2-danh-gia-giua-hoc-ki-i-tiet-6-7-viet-trang-86-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165248.html"
      }
    ]
  },
  {
    "week": 10,
    "theme": "Tuần 10. Trên con đường học tập",
    "lessons": [
      {
        "title": "Bài 17: Thư gửi các học sinh",
        "url": "https://loigiaihay.com/bai-17-thu-gui-cac-hoc-sinh-trang-89-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162882.html"
      },
      {
        "title": "Bài 17: Sử dụng từ điển",
        "url": "https://loigiaihay.com/bai-17-su-dung-tu-dien-trang-90-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162883.html"
      },
      {
        "title": "Bài 17: Tìm hiểu cách viết đoạn văn giới thiệu nhân vật trong một cuốn sách",
        "url": "https://loigiaihay.com/bai-17-tim-hieu-cach-viet-doan-van-gioi-thieu-nhan-vat-trong-mot-cuon-sach-trang-91-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162884.html"
      },
      {
        "title": "Bài 18: Tấm gương tự học",
        "url": "https://loigiaihay.com/bai-18-tam-guong-tu-hoc-trang-94-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162885.html"
      },
      {
        "title": "Bài 18: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-18-doc-mo-rong-trang-97-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162887.html"
      },
      {
        "title": "Bài 18: Tìm ý cho đoạn văn giới thiệu nhân vật trong một cuốn sách",
        "url": "https://loigiaihay.com/bai-18-tim-y-cho-doan-van-gioi-thieu-nhan-vat-trong-mot-cuon-sach-86-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a162886.html"
      }
    ]
  },
  {
    "week": 11,
    "theme": "Tuần 11. Trên con đường học tập",
    "lessons": [
      {
        "title": "Bài 19: Trải nghiệm để sáng tạo",
        "url": "https://loigiaihay.com/bai-19-trai-nghiem-de-sang-tao-trang-98-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165125.html"
      },
      {
        "title": "Bài 19: Luyện tập sử dụng từ điển",
        "url": "https://loigiaihay.com/bai-19-luyen-tap-su-dung-tu-dien-trang-100-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165126.html"
      },
      {
        "title": "Bài 19: Viết đoạn văn giới thiệu nhân vật trong một cuốn sách",
        "url": "https://loigiaihay.com/bai-19-viet-doan-van-gioi-thieu-nhan-vat-trong-mot-cuon-sach-trang-101-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165127.html"
      },
      {
        "title": "Bài 20: Khổ luyện thành tài",
        "url": "https://loigiaihay.com/bai-20-kho-luyen-thanh-tai-trang-102-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165128.html"
      },
      {
        "title": "Bài 20: Đánh giá, chỉnh sửa đoạn văn giới thiệu nhân vật trong một cuốn sách",
        "url": "https://loigiaihay.com/bai-20-danh-gia-chinh-sua-doan-van-gioi-thieu-nhan-vat-trong-mot-cuon-sach-trang-104-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165129.html"
      },
      {
        "title": "Bài 20: Cuốn sách tôi yêu",
        "url": "https://loigiaihay.com/bai-20-cuon-sach-toi-yeu-trang-104-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165130.html"
      }
    ]
  },
  {
    "week": 12,
    "theme": "Tuần 12. Trên con đường học tập",
    "lessons": [
      {
        "title": "Bài 21: Thế giới trong trang sách",
        "url": "https://loigiaihay.com/bai-21-the-gioi-trong-trang-sach-trang-105-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165131.html"
      },
      {
        "title": "Bài 21: Dấu gạch ngang",
        "url": "https://loigiaihay.com/bai-21-dau-gach-ngang-trang-106-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165132.html"
      },
      {
        "title": "Bài 21: Tìm hiểu cách viết đoạn văn thể hiện tình cảm, cảm xúc về một câu chuyện",
        "url": "https://loigiaihay.com/bai-21-tim-hieu-cach-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-cau-chuyen-trang-108-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165133.html"
      },
      {
        "title": "Bài 22: Từ những câu chuyện ấu thơ",
        "url": "https://loigiaihay.com/bai-22-tu-nhung-cau-chuyen-au-tho-trang-110-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165134.html"
      },
      {
        "title": "Bài 22: Tìm ý cho đoạn văn thể hiện tình cảm, cảm xúc về một câu chuyện",
        "url": "https://loigiaihay.com/bai-22-tim-y-cho-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-cau-chuyen-trang-112-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165135.html"
      },
      {
        "title": "Bài 22: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-22-doc-mo-rong-trang-113-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165136.html"
      }
    ]
  },
  {
    "week": 13,
    "theme": "Tuần 13. Trên con đường học tập",
    "lessons": [
      {
        "title": "Bài 23: Giới thiệu sách Dế mèn phiêu lưu kí",
        "url": "https://loigiaihay.com/bai-23-gioi-thieu-sach-de-men-phieu-luu-ki-trang-114-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165211.html"
      },
      {
        "title": "Bài 23: Luyện tập về dấu gạch ngang",
        "url": "https://loigiaihay.com/bai-23-luyen-tap-ve-dau-gach-ngang-trang-115-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165212.html"
      },
      {
        "title": "Bài 23: Viết đoạn văn thể hiện tình cảm, cảm xúc về một câu chuyện",
        "url": "https://loigiaihay.com/bai-23-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-cau-chuyen-trang-116-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165213.html"
      },
      {
        "title": "Bài 24: Tinh thần học tập của nhà Phi-lít",
        "url": "https://loigiaihay.com/bai-24-tinh-than-hoc-tap-cua-nha-phi-lit-trang-117-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165214.html"
      },
      {
        "title": "Bài 24: Đánh giá, chỉnh sửa đoạn văn thể hiện tình cảm, cảm xúc về một câu chuyện",
        "url": "https://loigiaihay.com/bai-24-danh-gia-chinh-sua-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-cau-chuyen-trang-119-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165215.html"
      },
      {
        "title": "Bài 24: Lợi ích của tự học",
        "url": "https://loigiaihay.com/bai-24-loi-ich-cua-tu-hoc-trang-120-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165216.html"
      }
    ]
  },
  {
    "week": 14,
    "theme": "Tuần 14. Nghệ thuật muôn màu",
    "lessons": [
      {
        "title": "Bài 25: Tiếng đàn Ba-La-Lai-Ca trên Sông Đà",
        "url": "https://loigiaihay.com/bai-25-tieng-dan-ba-la-lai-ca-tren-song-da-trang-121-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165217.html"
      },
      {
        "title": "Bài 25: Biện pháp điệp từ, điệp ngữ",
        "url": "https://loigiaihay.com/bai-24-bien-phap-diep-tu-diep-ngu-trang-123-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165218.html"
      },
      {
        "title": "Bài 25: Tìm hiểu cách viết đoạn văn thể hiện tình cảm, cảm xúc về một bài thơ",
        "url": "https://loigiaihay.com/bai-25-tim-hieu-cach-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-bai-tho-trang-125-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165219.html"
      },
      {
        "title": "Bài 26: Trí tưởng tượng phong phú",
        "url": "https://loigiaihay.com/bai-26-tri-tuong-tuong-phong-phu-trang-127-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165220.html"
      },
      {
        "title": "Bài 26: Tìm ý cho đoạn văn thể hiện tình cảm, cảm xúc về một bài thơ",
        "url": "https://loigiaihay.com/bai-26-tim-y-cho-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-bai-tho-trang-129-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165221.html"
      },
      {
        "title": "Bài 26: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-26-doc-mo-rong-trang-131-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165222.html"
      }
    ]
  },
  {
    "week": 15,
    "theme": "Tuần 15. Nghệ thuật muôn màu",
    "lessons": [
      {
        "title": "Bài 27: Tranh làng Hồ",
        "url": "https://loigiaihay.com/bai-27-tranh-lang-ho-trang-132-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165223.html"
      },
      {
        "title": "Bài 27: Luyện tập về điệp từ, điệp ngữ",
        "url": "https://loigiaihay.com/bai-27-luyen-tap-ve-diep-tu-diep-ngu-trang-134-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165224.html"
      },
      {
        "title": "Bài 27: Viết đoạn văn thể hiện tình cảm, cảm xúc về một bài thơ",
        "url": "https://loigiaihay.com/bai-27-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-bai-tho-trang-135-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165225.html"
      },
      {
        "title": "Bài 28: Tập hát quan họ",
        "url": "https://loigiaihay.com/bai-28-tap-hat-quan-ho-trang-136-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165226.html"
      },
      {
        "title": "Bài 28: Đánh giá, chỉnh sửa đoạn văn thể hiện tình cảm, cảm xúc về một bài thơ",
        "url": "https://loigiaihay.com/bai-28-danh-gia-chinh-sua-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-bai-tho-trang-138-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165227.html"
      },
      {
        "title": "Bài 28: Chương trình nghệ thuật em yêu thích",
        "url": "https://loigiaihay.com/bai-28-chuong-trinh-nghe-thuat-em-yeu-thich-trang-139-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165229.html"
      }
    ]
  },
  {
    "week": 16,
    "theme": "Tuần 16. Nghệ thuật muôn màu",
    "lessons": [
      {
        "title": "Bài 29: Kết từ",
        "url": "https://loigiaihay.com/bai-29-ket-tu-trang-141-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165231.html"
      },
      {
        "title": "Bài 29: Phim hoạt hình Chú ốc sân bay",
        "url": "https://loigiaihay.com/bai-29-phim-hoat-hinh-chu-oc-san-bay-trang-140-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165230.html"
      },
      {
        "title": "Bài 29: Tìm hiểu cách viết đoạn văn giới thiệu nhân vật trong một bộ phim hoạt hình",
        "url": "https://loigiaihay.com/bai-29-tim-hieu-cach-viet-doan-van-gioi-thieu-nhan-vat-trong-mot-bo-phim-hoat-hinh-trang-143-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165232.html"
      },
      {
        "title": "Bài 30: Nghệ thuật múa Ba lê",
        "url": "https://loigiaihay.com/bai-30-nghe-thuat-mua-ba-le-trang-145-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165233.html"
      },
      {
        "title": "Bài 30: Tìm ý cho đoạn văn giới thiệu nhân vật trong một bộ phim hoạt hình",
        "url": "https://loigiaihay.com/bai-30-tim-y-cho-doan-van-gioi-thieu-nhan-vat-trong-mot-bo-phim-hoat-hinh-trang-147-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165234.html"
      },
      {
        "title": "Bài 30: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-30-doc-mo-rong-trang-148-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165235.html"
      }
    ]
  },
  {
    "week": 17,
    "theme": "Tuần 17. Nghệ thuật muôn màu",
    "lessons": [
      {
        "title": "Bài 31: Một ngôi chùa độc đáo",
        "url": "https://loigiaihay.com/bai-31-mot-ngoi-chua-doc-dao-trang-149-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165236.html"
      },
      {
        "title": "Bài 31: Luyện tập về kết từ",
        "url": "https://loigiaihay.com/bai-31-luyen-tap-ve-ket-tu-trang-151-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165237.html"
      },
      {
        "title": "Bài 31: Viết đoạn văn giới thiệu nhân vật trong một bộ hoạt hình",
        "url": "https://loigiaihay.com/bai-31-viet-doan-van-gioi-thieu-nhan-vat-trong-mot-bo-hoat-hinh-trang-152-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165238.html"
      },
      {
        "title": "Bài 32: Sự tích chú Tễu",
        "url": "https://loigiaihay.com/bai-32-su-tich-chu-teu-trang-153-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165239.html"
      },
      {
        "title": "Bài 32: Đánh giá, chỉnh sửa đoạn văn giới thiệu nhân vật trong một bộ phim hoạt hình",
        "url": "https://loigiaihay.com/bai-32-danh-gia-chinh-sua-doan-van-gioi-thieu-nhan-vat-trong-mot-bo-phim-hoat-hinh-trang-156-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165240.html"
      },
      {
        "title": "Bài 32: Bộ phim yêu thích",
        "url": "https://loigiaihay.com/bai-32-bo-phim-yeu-thich-trang-156-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165241.html"
      }
    ]
  },
  {
    "week": 18,
    "theme": "Tuần 18. Ôn tập và đánh giá cuối học kì 1",
    "lessons": [
      {
        "title": "Phần 1 - Ôn tập: Tiết 1 - 2",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-1-2-trang-158-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165242.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 3 - 4",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-3-4-trang-160-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165243.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 5",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-5-trang-161-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165244.html"
      },
      {
        "title": "Phần 2 - Đánh giá cuối học kì I: Tiết 6 - 7: Bố đứng nhìn biển cả",
        "url": "https://loigiaihay.com/phan-2-danh-gia-cuoi-hoc-ki-i-tiet-6-7-bo-dung-nhin-bien-ca-trang-162-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165245.html"
      },
      {
        "title": "Phần 2 - Đánh giá cuối học kì I: Tiết 6 - 7: Những điều thú vị về chim di cư",
        "url": "https://loigiaihay.com/phan-2-danh-gia-cuoi-hoc-ki-i-tiet-6-7-nhung-dieu-thu-vi-ve-chim-di-cu-trang-163-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165246.html"
      },
      {
        "title": "Phần 2 - Đánh giá cuối học kì I: Tiết 6 - 7: Viết",
        "url": "https://loigiaihay.com/phan-2-danh-gia-cuoi-hoc-ki-i-tiet-6-7-viet-trang-164-sgk-tieng-viet-lop-5-tap-1-ket-noi-tri-thuc-a165247.html"
      }
    ]
  },
  {
    "week": 19,
    "theme": "Tuần 19. Vẻ đẹp cuộc sống",
    "lessons": [
      {
        "title": "Bài 1: Tiếng hát của người đá",
        "url": "https://loigiaihay.com/bai-1-tieng-hat-cua-nguoi-da-trang-8-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165309.html"
      },
      {
        "title": "Bài 1: Câu đơn và câu ghép",
        "url": "https://loigiaihay.com/bai-1-cau-don-va-cau-ghep-trang-10-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165310.html"
      },
      {
        "title": "Bài 1: Tìm hiểu cách viết bài văn tả người",
        "url": "https://loigiaihay.com/bai-1-tim-hieu-cach-viet-bai-van-ta-nguoi-trang-11-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165311.html"
      },
      {
        "title": "Bài 2: Khúc hát ru những em bé lớn trên lưng mẹ",
        "url": "https://loigiaihay.com/bai-2-khuc-hat-ru-nhung-em-be-lon-tren-lung-me-trang-13-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165313.html"
      },
      {
        "title": "Bài 2: Viết mở bài và kết bài cho bài văn tả người",
        "url": "https://loigiaihay.com/bai-2-viet-mo-bai-va-ket-bai-cho-bai-van-ta-nguoi-trang-15-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165314.html"
      },
      {
        "title": "Bài 2: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-2-doc-mo-rong-trang-16-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165315.html"
      }
    ]
  },
  {
    "week": 20,
    "theme": "Tuần 20. Vẻ đẹp cuộc sống",
    "lessons": [
      {
        "title": "Bài 3: Hạt gạo làng ta",
        "url": "https://loigiaihay.com/bai-3-hat-gao-lang-ta-trang-17-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165316.html"
      },
      {
        "title": "Bài 3: Cách nối các vế câu ghép",
        "url": "https://loigiaihay.com/bai-3-cach-noi-cac-ve-cau-ghep-trang-19-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165317.html"
      },
      {
        "title": "Bài 3: Quan sát để viết bài văn tả người",
        "url": "https://loigiaihay.com/bai-3-quan-sat-de-viet-bai-van-ta-nguoi-trang-20-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165318.html"
      },
      {
        "title": "Bài 4: Hộp quà màu thiên thanh",
        "url": "https://loigiaihay.com/bai-4-hop-qua-mau-thien-thanh-trang-22-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165319.html"
      },
      {
        "title": "Bài 4: Lập dàn ý cho bài văn tả người",
        "url": "https://loigiaihay.com/bai-4-lap-dan-y-cho-bai-van-ta-nguoi-trang-24-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165320.html"
      },
      {
        "title": "Bài 4: Nét đẹp học đường",
        "url": "https://loigiaihay.com/bai-4-net-dep-hoc-duong-trang-25-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165321.html"
      }
    ]
  },
  {
    "week": 21,
    "theme": "Tuần 21. Vẻ đẹp cuộc sống",
    "lessons": [
      {
        "title": "Bài 5: Giỏ hoa tháng năm",
        "url": "https://loigiaihay.com/bai-5-gio-hoa-thang-nam-trang-26-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165322.html"
      },
      {
        "title": "Bài 5: Cách nối các vế câu ghép (Tiếp theo)",
        "url": "https://loigiaihay.com/bai-5-cach-noi-cac-ve-cau-ghep-tiep-theo-trang-27-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165323.html"
      },
      {
        "title": "Bài 5: Viết đoạn văn tả người",
        "url": "https://loigiaihay.com/bai-5-viet-doan-van-ta-nguoi-trang-28-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165324.html"
      },
      {
        "title": "Bài 6: Thư của bố",
        "url": "https://loigiaihay.com/bai-6-thu-cua-bo-trang-30-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165325.html"
      },
      {
        "title": "Bài 6: Viết bài văn tả người (Bài viết số 1)",
        "url": "https://loigiaihay.com/bai-6-viet-bai-van-ta-nguoi-bai-viet-so-1-trang-32-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165326.html"
      },
      {
        "title": "Bài 6 Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-6-doc-mo-rong-trang-33-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165327.html"
      }
    ]
  },
  {
    "week": 22,
    "theme": "Tuần 22. Vẻ đẹp cuộc sống",
    "lessons": [
      {
        "title": "Bài 7: Đoàn thuyền đánh cá",
        "url": "https://loigiaihay.com/bai-7-doan-thuyen-danh-ca-trang-34-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165333.html"
      },
      {
        "title": "Bài 7: Luyện tập về câu ghép",
        "url": "https://loigiaihay.com/bai-7-luyen-tap-ve-cau-ghep-trang-36-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165334.html"
      },
      {
        "title": "Bài 7: Đánh giá, chỉnh sửa bài văn tả người",
        "url": "https://loigiaihay.com/bai-7-danh-gia-chinh-sua-bai-van-ta-nguoi-trang-37-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165335.html"
      },
      {
        "title": "Bài 8: Khu rừng của Mát",
        "url": "https://loigiaihay.com/bai-8-khu-rung-cua-mat-trang-38-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165337.html"
      },
      {
        "title": "Bài 8: Viết bài văn tả người (Bài viết số 2)",
        "url": "https://loigiaihay.com/bai-8-viet-bai-van-ta-nguoi-bai-viet-so-2-trang-40-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165338.html"
      },
      {
        "title": "Bài 8: Những ý kiến khác biệt",
        "url": "https://loigiaihay.com/bai-8-nhung-y-kien-khac-biet-trang-41-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165339.html"
      }
    ]
  },
  {
    "week": 23,
    "theme": "Tuần 23. Hương sắc trăm miền",
    "lessons": [
      {
        "title": "Bài 9: Hội thổi cơm thi ở Đồng Vân",
        "url": "https://loigiaihay.com/bai-9-hoi-thoi-com-thi-o-dong-van-trang-43-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165341.html"
      },
      {
        "title": "Bài 9: Liên kết câu bằng cách lặp từ ngữ",
        "url": "https://loigiaihay.com/bai-9-lien-ket-cau-bang-cach-lap-tu-ngu-trang-45-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165343.html"
      },
      {
        "title": "Bài 9: Tìm hiểu cách viết đoạn văn thể hiện tình cảm, cảm xúc về một sự việc",
        "url": "https://loigiaihay.com/bai-9-tim-hieu-cach-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-su-viec-trang-46-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165344.html"
      },
      {
        "title": "Bài 10: Những búp chè trên cây cổ thụ",
        "url": "https://loigiaihay.com/bai-10-nhung-bup-che-tren-cay-co-thu-trang-48-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165347.html"
      },
      {
        "title": "Bài 10: Tìm ý cho đoạn văn thể hiện tình cảm, cảm xúc về một sự việc",
        "url": "https://loigiaihay.com/bai-10-tim-y-cho-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-su-viec-trang-51-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165349.html"
      },
      {
        "title": "Bài 10: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-10-doc-mo-rong-trang-52-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165350.html"
      }
    ]
  },
  {
    "week": 24,
    "theme": "Tuần 24. Hương sắc trăm miền",
    "lessons": [
      {
        "title": "Bài 11: Hương cốm mùa thu",
        "url": "https://loigiaihay.com/bai-11-huong-com-mua-thu-trang-53-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165351.html"
      },
      {
        "title": "Bài 11: Liên kết câu bằng từ ngữ nối",
        "url": "https://loigiaihay.com/bai-11-lien-ket-cau-bang-tu-ngu-noi-trang-54-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165354.html"
      },
      {
        "title": "Bài 11: Viết đoạn văn thể hiện tình cảm, cảm xúc về một sự việc",
        "url": "https://loigiaihay.com/bai-11-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-su-viec-trang-56-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165356.html"
      },
      {
        "title": "Bài 12: Vũ điệu trên nền thổ cẩm",
        "url": "https://loigiaihay.com/bai-12-vu-dieu-tren-nen-tho-cam-trang-57-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165358.html"
      },
      {
        "title": "Bài 12: Đánh giá, chỉnh sửa đoạn văn thể hiện tình cảm, cảm xúc về một sự việc",
        "url": "https://loigiaihay.com/bai-12-danh-gia-chinh-sua-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-su-viec-trang-59-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165359.html"
      },
      {
        "title": "Bài 12: Địa điểm tham quan, du lịch",
        "url": "https://loigiaihay.com/bai-12-dia-diem-tham-quan-du-lich-trang-60-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165361.html"
      }
    ]
  },
  {
    "week": 25,
    "theme": "Tuần 25. Hương sắc trăm miền",
    "lessons": [
      {
        "title": "Bài 13: Đàn t'rưng - Tiếng ca đại ngàn",
        "url": "https://loigiaihay.com/bai-13-dan-trung-tieng-ca-dai-ngan-trang-61-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165389.html"
      },
      {
        "title": "Bài 13: Liên kết câu bằng từ ngữ thay thế",
        "url": "https://loigiaihay.com/bai-13-lien-ket-cau-bang-tu-ngu-thay-the-trang-62-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165390.html"
      },
      {
        "title": "Bài 13: Tìm hiểu cách viết chương trình hoạt động",
        "url": "https://loigiaihay.com/bai-13-tim-hieu-cach-viet-chuong-trinh-hoat-dong-trang-64-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165391.html"
      },
      {
        "title": "Bài 14: Đường quê Đồng Tháp Mười",
        "url": "https://loigiaihay.com/bai-14-duong-que-dong-thap-muoi-trang-66-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165392.html"
      },
      {
        "title": "Bài 14: Viết chương trình hoạt động (Bài viết số 1)",
        "url": "https://loigiaihay.com/bai-14-viet-chuong-trinh-hoat-dong-bai-viet-so-1-trang-68-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165393.html"
      },
      {
        "title": "Bài 14: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-14-doc-mo-rong-trang-69-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165394.html"
      }
    ]
  },
  {
    "week": 26,
    "theme": "Tuần 26. Hương sắc trăm miền",
    "lessons": [
      {
        "title": "Bài 15: Xuồng ba lá quê tôi",
        "url": "https://loigiaihay.com/bai-15-xuong-ba-la-que-toi-trang-70-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165395.html"
      },
      {
        "title": "Bài 15: Luyện tập về liên kết câu trong đoạn văn",
        "url": "https://loigiaihay.com/bai-15-luyen-tap-ve-lien-ket-cau-trong-doan-van-trang-71-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165396.html"
      },
      {
        "title": "Bài 15: Đánh giá, chỉnh sửa chương trình hoạt động",
        "url": "https://loigiaihay.com/bai-15-danh-gia-chinh-sua-chuong-trinh-hoat-dong-trang-72-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165397.html"
      },
      {
        "title": "Bài 16: Về thăm Đất Mũi",
        "url": "https://loigiaihay.com/bai-16-ve-tham-dat-mui-trang-73-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165398.html"
      },
      {
        "title": "Bài 16: Viết chương trình hoạt động (Bài viết số 2)",
        "url": "https://loigiaihay.com/bai-16-viet-chuong-trinh-hoat-dong-bai-viet-so-2-trang-75-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165399.html"
      },
      {
        "title": "Bài 16: Sản vật địa phương",
        "url": "https://loigiaihay.com/bai-16-san-vat-dia-phuong-trang-75-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165400.html"
      }
    ]
  },
  {
    "week": 27,
    "theme": "Tuần 27. Ôn tập và đánh giá giữa học kì 2",
    "lessons": [
      {
        "title": "Phần 1 - Ôn tập: Tiết 1 - 2",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-1-2-trang-77-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165680.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 3 - 4",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-3-4-trang-78-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165686.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 5",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-5-trang-82-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165690.html"
      },
      {
        "title": "Phần 2 - Đánh giá giữa học kì II: Tiết 6 - 7: Mưa",
        "url": "https://loigiaihay.com/phan-2-danh-gia-giua-hoc-ki-ii-tiet-6-7-mua-trang-83-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165693.html"
      },
      {
        "title": "Phần 2 - Đánh giá giữa học kì II: Tiết 6 - 7: Mùa mật mới",
        "url": "https://loigiaihay.com/phan-2-danh-gia-giua-hoc-ki-ii-tiet-6-7-mua-mat-moi-trang-84-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165697.html"
      },
      {
        "title": "Phần 2 - Đánh giá giữa học kì II: Tiết 6 - 7: Viết",
        "url": "https://loigiaihay.com/phan-2-danh-gia-giua-hoc-ki-ii-tiet-6-7-viet-trang-86-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165699.html"
      }
    ]
  },
  {
    "week": 28,
    "theme": "Tuần 28. Tiếp bước cha ông",
    "lessons": [
      {
        "title": "Bài 17: Nghìn năm văn hiến",
        "url": "https://loigiaihay.com/bai-17-nghin-nam-van-hien-trang-88-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165720.html"
      },
      {
        "title": "Bài 17: Luyện tập về đại từ và kết từ",
        "url": "https://loigiaihay.com/bai-17-luyen-tap-ve-dai-tu-va-ket-tu-trang-90-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165721.html"
      },
      {
        "title": "Bài 17: Tìm hiểu cách viết đoạn văn nêu ý kiến tán thành một sự việc, hiện tượng",
        "url": "https://loigiaihay.com/bai-17-tim-hieu-cach-viet-doan-van-neu-y-kien-tan-thanh-mot-su-viec-hien-tuong-trang-91sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165722.html"
      },
      {
        "title": "Bài 18: Người thầy của muôn đời",
        "url": "https://loigiaihay.com/bai-18-nguoi-thay-cua-muon-doi-trang-93-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165723.html"
      },
      {
        "title": "Bài 18: Tìm ý cho đoạn văn nêu ý kiến tán thành một sự việc, hiện tượng",
        "url": "https://loigiaihay.com/bai-18-tim-y-cho-doan-van-neu-y-kien-tan-thanh-mot-su-viec-hien-tuong-trang-95-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165724.html"
      },
      {
        "title": "Bài 18: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-18-doc-mo-rong-trang-96-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165725.html"
      }
    ]
  },
  {
    "week": 29,
    "theme": "Tuần 29. Tiếp bước cha ông",
    "lessons": [
      {
        "title": "Bài 19: Danh y Tuệ Tĩnh",
        "url": "https://loigiaihay.com/bai-19-danh-y-tue-tinh-trang-97-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165726.html"
      },
      {
        "title": "Bài 19: Luyện tập về từ đồng nghĩa và từ đa nghĩa",
        "url": "https://loigiaihay.com/bai-19-luyen-tap-ve-tu-dong-nghia-va-tu-da-nghia-trang-99-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165727.html"
      },
      {
        "title": "Bài 19: Viết đoạn văn nêu ý kiến tán thành một sự việc, hiện tượng (Bài viết số 1)",
        "url": "https://loigiaihay.com/bai-19-viet-doan-van-neu-y-kien-tan-thanh-mot-su-viec-hien-tuong-bai-viet-so-1-trang-100-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165728.html"
      },
      {
        "title": "Bài 20: Cụ Đồ Chiểu",
        "url": "https://loigiaihay.com/bai-20-cu-do-chieu-trang-101-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165729.html"
      },
      {
        "title": "Bài 20: Đánh giá, chỉnh sửa đoạn văn nêu ý kiến tán thành một sự vật, hiện tượng",
        "url": "https://loigiaihay.com/bai-20-danh-gia-chinh-sua-doan-van-neu-y-kien-tan-thanh-mot-su-vat-hien-tuong-trang-103-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165730.html"
      },
      {
        "title": "Bài 20: Đền ơn đáp nghĩa",
        "url": "https://loigiaihay.com/bai-20-den-on-dap-nghia-trang-104-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165731.html"
      }
    ]
  },
  {
    "week": 30,
    "theme": "Tuần 30. Tiếp bước cha ông",
    "lessons": [
      {
        "title": "Bài 21: Anh hùng lao động Trần Đại Nghĩa",
        "url": "https://loigiaihay.com/bai-21-anh-hung-lao-dong-tran-dai-nghia-trang-106-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165796.html"
      },
      {
        "title": "Bài 21: Luyện tập về câu ghép",
        "url": "https://loigiaihay.com/bai-21-luyen-tap-ve-cau-ghep-trang-107-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165801.html"
      },
      {
        "title": "Bài 21: Viết đoạn văn nêu ý kiến tán thành một sự việc, hiện tượng (Bài viết số 2)",
        "url": "https://loigiaihay.com/bai-21-viet-doan-van-neu-y-kien-tan-thanh-mot-su-viec-hien-tuong-bai-viet-so-2-trang-108-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165803.html"
      },
      {
        "title": "Bài 22: Bộ đội về làng",
        "url": "https://loigiaihay.com/bai-22-bo-doi-ve-lang-trang-109-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165806.html"
      },
      {
        "title": "Bài 22: Luyện viết đoạn văn thể hiện tình cảm, cảm xúc về một sự việc",
        "url": "https://loigiaihay.com/bai-22-luyen-viet-doan-van-the-hien-tinh-cam-cam-xuc-ve-mot-su-viec-trang-111-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165808.html"
      },
      {
        "title": "Bài 22: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-22-doc-mo-rong-trang-111-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165810.html"
      }
    ]
  },
  {
    "week": 31,
    "theme": "Tuần 31. Tiếp bước cha ông",
    "lessons": [
      {
        "title": "Bài 23: Về ngôi nhà đang xây",
        "url": "https://loigiaihay.com/bai-23-ve-ngoi-nha-dang-xay-trang-113-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165818.html"
      },
      {
        "title": "Bài 23: Viết hoa danh từ chung để thể hiện sự tôn trọng đặc biệt",
        "url": "https://loigiaihay.com/bai-23-viet-hoa-danh-tu-chung-de-the-hien-su-ton-trong-khac-biet-trang-113-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165819.html"
      },
      {
        "title": "Bài 23: Luyện tập lập dàn ý cho bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-23-luyen-tap-dan-y-cho-bai-van-ta-phong-canh-trang-116-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165820.html"
      },
      {
        "title": "Bài 24: Việt Nam quê hương ta",
        "url": "https://loigiaihay.com/bai-24-viet-nam-que-huong-ta-trang-117-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165821.html"
      },
      {
        "title": "Bài 24: Luyện viết bài văn tả phong cảnh",
        "url": "https://loigiaihay.com/bai-24-luyen-viet-bai-van-ta-phong-canh-trang-118-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165822.html"
      },
      {
        "title": "Bài 24: Di tích lịch sử",
        "url": "https://loigiaihay.com/bai-24-di-tich-lich-su-trang-119-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a165823.html"
      }
    ]
  },
  {
    "week": 32,
    "theme": "Tuần 32. Thế giới của chúng ta",
    "lessons": [
      {
        "title": "Bài 25: Bài ca trái đất",
        "url": "https://loigiaihay.com/bai-25-bai-ca-trai-dat-trang-122-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166489.html"
      },
      {
        "title": "Bài 25: Cách viết tên người và tên địa lí nước ngoài",
        "url": "https://loigiaihay.com/bai-25-cach-viet-ten-nguoi-va-ten-dia-li-nuoc-ngoai-trang-123-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166490.html"
      },
      {
        "title": "Bài 25: Luyện tập lập dàn ý cho bài văn tả người",
        "url": "https://loigiaihay.com/bai-25-luyen-tap-lap-dan-y-cho-bai-van-ta-nguoi-trang-125-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166491.html"
      },
      {
        "title": "Bài 26: Những con hạc giấy",
        "url": "https://loigiaihay.com/bai-26-nhung-con-hac-giay-trang-126-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166493.html"
      },
      {
        "title": "Bài 26: Luyện viết bài văn tả người",
        "url": "https://loigiaihay.com/bai-26-luyen-viet-bai-van-ta-nguoi-trang-128-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166495.html"
      },
      {
        "title": "Bài 26: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-26-doc-mo-rong-trang-129-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166497.html"
      }
    ]
  },
  {
    "week": 33,
    "theme": "Tuần 33. Thế giới của chúng ta",
    "lessons": [
      {
        "title": "Bài 27: Người hùng thầm lặng",
        "url": "https://loigiaihay.com/bai-27-nguoi-hung-tham-lang-trang-130-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166505.html"
      },
      {
        "title": "Bài 27: Luyện tập về dấu gạch ngang",
        "url": "https://loigiaihay.com/bai-27-luyen-tap-ve-dau-gach-ngang-trang-132-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166506.html"
      },
      {
        "title": "Bài 27: Tìm hiểu cách viết đoạn văn nêu ý kiến phản đối một sự việc, hiện tượng",
        "url": "https://loigiaihay.com/bai-27-tim-hieu-cach-viet-doan-van-neu-y-kien-phan-doi-mot-su-viec-hien-tuong-trang-133-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166507.html"
      },
      {
        "title": "Bài 28: Giờ trái đất",
        "url": "https://loigiaihay.com/bai-28-gio-trai-dat-trang-135-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166514.html"
      },
      {
        "title": "Bài 28: Tìm ý cho đoạn văn nêu ý kiến phản đối một sự việc, hiện tượng",
        "url": "https://loigiaihay.com/bai-28-tim-y-cho-doan-van-neu-y-kien-phan-doi-mot-su-viec-hien-tuong-trang-137-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166524.html"
      },
      {
        "title": "Bài 28: Trải nghiệm ngày hè",
        "url": "https://loigiaihay.com/bai-28-trai-nghiem-ngay-he-trang-138-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166525.html"
      }
    ]
  },
  {
    "week": 34,
    "theme": "Tuần 34. Thế giới của chúng ta",
    "lessons": [
      {
        "title": "Bài 29: Điện thoại di động",
        "url": "https://loigiaihay.com/bai-29-dien-thoai-di-dong-trang-140-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166527.html"
      },
      {
        "title": "Bài 29: Luyện tập về liên kết câu trong đoạn văn",
        "url": "https://loigiaihay.com/bai-29-luyen-tap-ve-lien-ket-cau-trong-doan-van-trang-142-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166528.html"
      },
      {
        "title": "Bài 29: Viết đoạn văn nêu ý kiến phản đối một sự việc, hiện tượng",
        "url": "https://loigiaihay.com/bai-29-viet-doan-van-neu-y-kien-phan-doi-mot-su-viec-hien-tuong-trang-143-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166529.html"
      },
      {
        "title": "Bài 30: Thành phố thông minh Mát-xđa",
        "url": "https://loigiaihay.com/bai-30-thanh-pho-thong-minh-mat-xda-trang-144-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166530.html"
      },
      {
        "title": "Bài 30: Đánh giá, chỉnh sửa đoạn văn nêu ý kiến phản đối một sự việc, hiện tượng",
        "url": "https://loigiaihay.com/bai-30-danh-gia-chinh-sua-doan-van-neu-y-kien-phan-doi-mot-su-viec-hien-tuong-trang-146-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166531.html"
      },
      {
        "title": "Bài 30: Đọc mở rộng",
        "url": "https://loigiaihay.com/bai-30-doc-mo-rong-trang-147-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166532.html"
      }
    ]
  },
  {
    "week": 35,
    "theme": "Tuần 35. Ôn tập và Đánh giá cuối năm học",
    "lessons": [
      {
        "title": "Phần 1 - Ôn tập: Tiết 1 - 2",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-1-2-trang-148-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166533.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 3 - 4",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-3-4-trang-150-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166534.html"
      },
      {
        "title": "Phần 1 - Ôn tập: Tiết 5",
        "url": "https://loigiaihay.com/phan-1-on-tap-tiet-5-trang-153-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166535.html"
      },
      {
        "title": "Phần 2 - Đánh giá cuối năm học: Tiết 6 - 7: Qua Thậm Thình",
        "url": "https://loigiaihay.com/phan-2-danh-gia-cuoi-nam-hoc-tiet-6-7-qua-tham-thinh-trang-154-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166536.html"
      },
      {
        "title": "Phần 2 - Đánh giá cuối năm học: Tiết 6 - 7: Phong cảnh đền Hùng",
        "url": "https://loigiaihay.com/phan-2-danh-gia-cuoi-nam-hoc-tiet-6-7-phong-canh-den-hung-trang-155-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166537.html"
      },
      {
        "title": "Phần 2 - Đánh giá cuối năm học: Tiết 6 - 7: Viết",
        "url": "https://loigiaihay.com/phan-2-danh-gia-cuoi-nam-hoc-tiet-6-7-viet-trang-157-sgk-tieng-viet-lop-5-tap-2-ket-noi-tri-thuc-a166538.html"
      }
    ]
  }
]

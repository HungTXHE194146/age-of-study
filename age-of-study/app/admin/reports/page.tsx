"use client";

import { useState, useRef } from "react";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Users,
  BarChart3,
  GraduationCap,
  School,
  Loader2,
} from "lucide-react";
import { getClassComparisonData, getTeacherActivityReport } from "@/lib/analyticsService";
import ExcelJS from "exceljs";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import html2canvas from "html2canvas";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<"class" | "teacher" | "comprehensive">("comprehensive");
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDFReport = async () => {
    setLoading(true);
    try {
      const [classData, teacherData] = await Promise.all([
        getClassComparisonData(),
        getTeacherActivityReport(),
      ]);

      if (classData.error || teacherData.error) {
        alert("Có lỗi khi tải dữ liệu: " + (classData.error || teacherData.error));
        return;
      }

      const [regularBytes, boldBytes] = await Promise.all([
        fetch("/fonts/BeVietnamPro-Regular.ttf").then((r) => r.arrayBuffer()),
        fetch("/fonts/BeVietnamPro-Bold.ttf").then((r) => r.arrayBuffer()),
      ]);

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const font = await pdfDoc.embedFont(regularBytes, { subset: true });
      const boldFont = await pdfDoc.embedFont(boldBytes, { subset: true });

      const PAGE_W = 595;
      const PAGE_H = 842;
      const MX = 55;           // horizontal margin
      const MT = 45;           // top margin
      const MB = 50;           // bottom margin (footer space)
      const CW = PAGE_W - MX * 2; // content width
      const LH = 18;           // standard line height

      let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MT;

      // Ensure enough vertical space; add new page if not
      const ensurePage = (needed: number) => {
        if (y - needed < MB) {
          page = pdfDoc.addPage([PAGE_W, PAGE_H]);
          y = PAGE_H - MT;
        }
      };

      // Draw text at current y, then advance y downward
      const put = (
        text: string,
        x: number,
        opts: { size?: number; bold?: boolean; color?: [number, number, number]; advance?: number } = {}
      ) => {
        const { size = 11, bold = false, color = [0, 0, 0], advance = size + 7 } = opts;
        page.drawText(text, {
          x, y,
          size,
          font: bold ? boldFont : font,
          color: rgb(color[0], color[1], color[2]),
        });
        y -= advance;
      };

      // Draw text centered on page
      const putCentered = (
        text: string,
        opts: { size?: number; bold?: boolean; color?: [number, number, number]; advance?: number } = {}
      ) => {
        const { size = 11, bold = false } = opts;
        const f = bold ? boldFont : font;
        const w = f.widthOfTextAtSize(text, size);
        put(text, (PAGE_W - w) / 2, opts);
      };

      const hline = (x1: number, x2: number, thickness = 0.5, color: [number, number, number] = [0.6, 0.6, 0.6]) => {
        page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: rgb(...color) });
      };

      const now = new Date();
      const dd = now.getDate();
      const mm = now.getMonth() + 1;
      const yyyy = now.getFullYear();

      // ── LETTERHEAD ────────────────────────────────────────────────────────────
      // Left column: authority chain
      const leftX = MX;
      const rightX = PAGE_W / 2 + 20;

      // Row 1
      page.drawText("UBND XÃ NINH LAI", { x: leftX, y, size: 9.5, font, color: rgb(0, 0, 0) });
      page.drawText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { x: rightX, y, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });
      y -= 15;

      // Row 2
      const schoolName = "TRƯỜNG TIỂU HỌC NINH LAI";
      page.drawText(schoolName, { x: leftX, y, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });

      const motto = "Độc lập - Tự do - Hạnh phúc";
      const mottoW = font.widthOfTextAtSize(motto, 9.5);
      const chxhW = boldFont.widthOfTextAtSize("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 9.5);
      const mottoX = rightX + (chxhW - mottoW) / 2;
      page.drawText(motto, { x: mottoX, y, size: 9.5, font, color: rgb(0, 0, 0) });
      y -= 5;

      // Underline both
      const snW = boldFont.widthOfTextAtSize(schoolName, 9.5);
      page.drawLine({ start: { x: leftX, y }, end: { x: leftX + snW, y }, thickness: 0.75, color: rgb(0, 0, 0) });
      page.drawLine({ start: { x: mottoX, y }, end: { x: mottoX + mottoW, y }, thickness: 0.75, color: rgb(0, 0, 0) });
      y -= 4;

      // Separator between header columns (vertical line at center)
      const centerLine = PAGE_W / 2 + 5;
      page.drawLine({ start: { x: centerLine, y: y + 40 }, end: { x: centerLine, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
      y -= 18;

      // ── DOCUMENT TITLE ────────────────────────────────────────────────────────
      const reportTitle = reportType === "class"
        ? "BÁO CÁO KẾT QUẢ HỌC TẬP CÁC LỚP"
        : reportType === "teacher"
        ? "BÁO CÁO HOẠT ĐỘNG GIÁO VIÊN"
        : "BÁO CÁO TỔNG HỢP HOẠT ĐỘNG DẠY VÀ HỌC";

      const titleSize = 15;
      const titleW = boldFont.widthOfTextAtSize(reportTitle, titleSize);
      const titleX = (PAGE_W - titleW) / 2;
      page.drawText(reportTitle, { x: titleX, y, size: titleSize, font: boldFont, color: rgb(0, 0, 0) });
      y -= 5;
      // Underline title
      page.drawLine({ start: { x: titleX, y }, end: { x: titleX + titleW, y }, thickness: 1.2, color: rgb(0, 0, 0) });
      y -= 14;

      // Sub-description
      const subDesc = "Trên nền tảng học tập Age of Study";
      putCentered(subDesc, { size: 11, bold: false, color: [0.2, 0.2, 0.2] });
      y -= 4;

      // Date line
      const dateLine = `Ninh Lai, ngày ${dd} tháng ${mm} năm ${yyyy}`;
      putCentered(`(${dateLine})`, { size: 9.5, color: [0.35, 0.35, 0.35], advance: 20 });

      // Full-width rule
      hline(MX, PAGE_W - MX, 1.5, [0.1, 0.25, 0.6]);
      y -= 14;

      // ── INTRO PARAGRAPH ───────────────────────────────────────────────────────
      put(
        "Căn cứ số liệu thực tế từ hệ thống quản lý học tập Age of Study,",
        MX + 24, { size: 10, advance: 14 }
      );
      put(
        "Trường Tiểu học Ninh Lai lập báo cáo kết quả hoạt động dạy và học như sau:",
        MX + 24, { size: 10, advance: 20 }
      );

      // ── SECTION I: CLASS DATA ─────────────────────────────────────────────────
      if ((reportType === "class" || reportType === "comprehensive") && classData.data) {
        ensurePage(220);

        put("I. THỐNG KÊ KẾT QUẢ HỌC TẬP CÁC LỚP", MX, {
          size: 12, bold: true, color: [0.07, 0.23, 0.62], advance: 16,
        });

        const s = classData.data.summary;

        // Stats box
        const boxRows: [string, string][] = [
          ["Tổng số lớp đang hoạt động", `${s.totalClasses} lớp`],
          ["Tổng số học sinh toàn trường", `${s.totalStudents} học sinh`],
          ["Điểm trung bình toàn trường", s.averageScore > 0 ? `${s.averageScore.toFixed(1)} điểm` : "Chưa có dữ liệu"],
          ["Tỷ lệ hoàn thành bài học trung bình", `${s.averageCompletion.toFixed(1)}%`],
          ["Lớp có kết quả cao nhất", s.highestPerformingClass || "N/A"],
          ["Lớp cần hỗ trợ thêm", s.lowestPerformingClass || "N/A"],
        ];
        const boxH = boxRows.length * LH + 14;
        page.drawRectangle({
          x: MX, y: y - boxH, width: CW, height: boxH,
          color: rgb(0.95, 0.97, 1),
          borderColor: rgb(0.68, 0.78, 0.94),
          borderWidth: 0.75,
        });
        y -= 8;
        for (const [label, val] of boxRows) {
          ensurePage(LH);
          page.drawText(`${label}:`, { x: MX + 14, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
          page.drawText(val, { x: MX + 265, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
          y -= LH;
        }
        y -= 14;

        // Class ranking table
        ensurePage(160);
        put("1. Bảng xếp hạng các lớp theo điểm trung bình:", MX, {
          size: 11, bold: true, color: [0.1, 0.1, 0.1], advance: 14,
        });

        const TM = MX + 4;
        const TW = CW - 8;
        // col positions: #, Tên lớp, Khối, Điểm TB, Hoàn thành, Tiến độ
        const cX = [TM, TM + 28, TM + 155, TM + 230, TM + 305, TM + 390];
        const cH = ["#", "Tên lớp", "Khối", "Điểm TB", "Hoàn thành", "Tiến độ (HT/TC)"];

        // Header
        ensurePage(LH + 6);
        page.drawRectangle({ x: TM, y: y - 5, width: TW, height: LH + 5, color: rgb(0.07, 0.23, 0.62) });
        cH.forEach((h, i) => page.drawText(h, { x: cX[i] + 3, y, size: 9, font: boldFont, color: rgb(1, 1, 1) }));
        y -= LH + 8;

        const topClasses = [...classData.data.classes]
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 10);

        topClasses.forEach((cls, i) => {
          ensurePage(LH);
          const bg: [number, number, number] = i % 2 === 0 ? [0.96, 0.97, 1] : [1, 1, 1];
          page.drawRectangle({ x: TM, y: y - 4, width: TW, height: LH, color: rgb(...bg) });
          const hasData = cls.completedNodes > 0;
          const row = [
            `${i + 1}`,
            cls.className,
            `Khối ${cls.grade}`,
            hasData ? cls.averageScore.toFixed(1) : "-",
            hasData ? `${cls.completionRate.toFixed(1)}%` : "-",
            `${cls.completedNodes}/${cls.totalAssignedNodes}`,
          ];
          row.forEach((v, j) => page.drawText(v, { x: cX[j] + 3, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) }));
          y -= LH;
        });
        y -= 16;
      }

      // ── SECTION II: TEACHER DATA ──────────────────────────────────────────────
      if ((reportType === "teacher" || reportType === "comprehensive") && teacherData.data) {
        ensurePage(220);

        const secNum = reportType === "comprehensive" ? "II" : "I";
        put(`${secNum}. THỐNG KÊ HOẠT ĐỘNG GIÁO VIÊN`, MX, {
          size: 12, bold: true, color: [0.07, 0.23, 0.62], advance: 16,
        });

        const s = teacherData.data.summary;
        const tboxRows: [string, string][] = [
          ["Tổng số giáo viên", `${s.totalTeachers} người`],
          ["Hoạt động trong 7 ngày qua", `${s.activeTeachers} người`],
          ["Chưa hoạt động gần đây", `${s.inactiveTeachers} người`],
          ["Chưa đăng nhập lần nào", `${s.neverLoggedIn} người`],
          ["Số lớp phụ trách trung bình", `${s.averageClassesPerTeacher.toFixed(1)} lớp/giáo viên`],
        ];
        const tboxH = tboxRows.length * LH + 14;
        page.drawRectangle({
          x: MX, y: y - tboxH, width: CW, height: tboxH,
          color: rgb(0.95, 0.97, 1),
          borderColor: rgb(0.68, 0.78, 0.94),
          borderWidth: 0.75,
        });
        y -= 8;
        for (const [label, val] of tboxRows) {
          ensurePage(LH);
          page.drawText(`${label}:`, { x: MX + 14, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
          page.drawText(val, { x: MX + 285, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
          y -= LH;
        }
        y -= 14;

        // Active teachers table
        const activeTeachers = teacherData.data.teachers.filter((t) => t.activityStatus === "active");
        if (activeTeachers.length > 0) {
          ensurePage(120);
          put("1. Giáo viên hoạt động tích cực:", MX, { size: 11, bold: true, color: [0.1, 0.1, 0.1], advance: 14 });

          const TM2 = MX + 4;
          const TW2 = CW - 8;
          const cX2 = [TM2, TM2 + 165, TM2 + 315, TM2 + 375, TM2 + 425];
          const cH2 = ["Họ và tên", "Email / Tên đăng nhập", "Số lớp", "Số HS", "Môn"];

          ensurePage(LH + 6);
          page.drawRectangle({ x: TM2, y: y - 5, width: TW2, height: LH + 5, color: rgb(0.07, 0.4, 0.15) });
          cH2.forEach((h, i) => page.drawText(h, { x: cX2[i] + 3, y, size: 9, font: boldFont, color: rgb(1, 1, 1) }));
          y -= LH + 8;

          activeTeachers.slice(0, 12).forEach((t, i) => {
            ensurePage(LH);
            const bg: [number, number, number] = i % 2 === 0 ? [0.94, 0.99, 0.95] : [1, 1, 1];
            page.drawRectangle({ x: TM2, y: y - 4, width: TW2, height: LH, color: rgb(...bg) });
            const row2 = [
              t.fullName || "N/A",
              t.email || t.username || "N/A",
              `${t.totalClasses}`,
              `${t.totalStudents}`,
              t.subjects.join(", ") || "-",
            ];
            row2.forEach((v, j) => page.drawText(v, { x: cX2[j] + 3, y, size: 9, font, color: rgb(0, 0.3, 0.05) }));
            y -= LH;
          });
          y -= 14;
        }

        // Inactive teachers warning table
        const problematic = teacherData.data.teachers.filter((t) => t.activityStatus !== "active");
        if (problematic.length > 0) {
          ensurePage(120);
          put("2. Giáo viên cần theo dõi (chưa hoạt động gần đây):", MX, {
            size: 11, bold: true, color: [0.6, 0.1, 0.1], advance: 14,
          });

          const TM3 = MX + 4;
          const TW3 = CW - 8;
          const cX3 = [TM3, TM3 + 165, TM3 + 310, TM3 + 390];
          const cH3 = ["Họ và tên", "Trạng thái", "Số ngày vắng", "Lần cuối hoạt động"];

          ensurePage(LH + 6);
          page.drawRectangle({ x: TM3, y: y - 5, width: TW3, height: LH + 5, color: rgb(0.6, 0.1, 0.1) });
          cH3.forEach((h, i) => page.drawText(h, { x: cX3[i] + 3, y, size: 9, font: boldFont, color: rgb(1, 1, 1) }));
          y -= LH + 8;

          problematic.slice(0, 12).forEach((t, i) => {
            ensurePage(LH);
            const bg: [number, number, number] = i % 2 === 0 ? [1, 0.95, 0.95] : [1, 1, 1];
            page.drawRectangle({ x: TM3, y: y - 4, width: TW3, height: LH, color: rgb(...bg) });
            const statusLabel = t.activityStatus === "never" ? "Chưa đăng nhập" : "Không hoạt động";
            const daysStr = t.activityStatus === "never" ? "-" : `${t.daysInactive} ngày`;
            const lastStr = t.lastActive ? new Date(t.lastActive).toLocaleDateString("vi-VN") : "Chưa bao giờ";
            [t.fullName || "N/A", statusLabel, daysStr, lastStr].forEach((v, j) =>
              page.drawText(v, { x: cX3[j] + 3, y, size: 9, font, color: rgb(0.5, 0.1, 0.1) })
            );
            y -= LH;
          });
          y -= 14;
        }
      }

      // ── CONCLUSION + SIGNATURE ────────────────────────────────────────────────
      ensurePage(130);
      y -= 8;
      hline(MX, PAGE_W - MX, 0.5, [0.75, 0.75, 0.75]);
      y -= 14;

      put(
        "Trên đây là báo cáo tình hình hoạt động dạy và học của Trường Tiểu học Ninh Lai trên",
        MX + 24, { size: 10, advance: 14 }
      );
      put(
        "nền tảng Age of Study. Kính trình Ban Giám hiệu xem xét, chỉ đạo.",
        MX + 24, { size: 10, advance: 24 }
      );

      // Signature block — right side
      const sigBlockX = PAGE_W - MX - 170;
      const sigDateStr = `Ninh Lai, ngày ${dd} tháng ${mm} năm ${yyyy}`;
      const sdW = font.widthOfTextAtSize(sigDateStr, 10);
      page.drawText(sigDateStr, { x: sigBlockX + (170 - sdW) / 2, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 16;

      const sigLabel = "HIỆU TRƯỞNG";
      const slW = boldFont.widthOfTextAtSize(sigLabel, 12);
      page.drawText(sigLabel, { x: sigBlockX + (170 - slW) / 2, y, size: 12, font: boldFont, color: rgb(0, 0, 0) });
      y -= 14;

      const sigNote = "(Ký, ghi rõ họ tên và đóng dấu)";
      const snW2 = font.widthOfTextAtSize(sigNote, 9);
      page.drawText(sigNote, { x: sigBlockX + (170 - snW2) / 2, y, size: 9, font, color: rgb(0.45, 0.45, 0.45) });

      // ── FOOTER (every page) ───────────────────────────────────────────────────
      const pages = pdfDoc.getPages();
      pages.forEach((p, i) => {
        p.drawLine({ start: { x: MX, y: 38 }, end: { x: PAGE_W - MX, y: 38 }, thickness: 0.5, color: rgb(0.72, 0.72, 0.72) });
        p.drawText("Trường Tiểu học Ninh Lai  |  Nền tảng học tập Age of Study", {
          x: MX, y: 26, size: 7.5, font, color: rgb(0.5, 0.5, 0.5),
        });
        const pageLabel = `Trang ${i + 1} / ${pages.length}`;
        const pgW = font.widthOfTextAtSize(pageLabel, 7.5);
        p.drawText(pageLabel, { x: PAGE_W - MX - pgW, y: 26, size: 7.5, font, color: rgb(0.5, 0.5, 0.5) });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `bao-cao-${reportType}-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Có lỗi khi tạo PDF: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateExcelReport = async () => {
    setLoading(true);
    try {
      const [classData, teacherData] = await Promise.all([
        getClassComparisonData(),
        getTeacherActivityReport(),
      ]);

      if (classData.error || teacherData.error) {
        alert("Có lỗi khi tải dữ liệu: " + (classData.error || teacherData.error));
        return;
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Age of Study Admin";
      workbook.created = new Date();

      // ── Shared helpers ──────────────────────────────────────────────────────
      type BS = ExcelJS.BorderStyle;
      const thin = (argb = "FFD1D5DB") => ({ style: "thin" as BS, color: { argb } });
      const medium = (argb = "FF9CA3AF") => ({ style: "medium" as BS, color: { argb } });

      const CELL_BORDER = { top: thin(), left: thin(), bottom: thin(), right: thin() };
      const OUTER_BORDER = { top: medium(), left: medium(), bottom: medium(), right: medium() };

      const applyBorders = (row: ExcelJS.Row, isLast = false) =>
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = isLast ? { ...CELL_BORDER, bottom: medium() } : CELL_BORDER;
        });

      const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

      const styleHeader = (row: ExcelJS.Row) => {
        row.height = 30;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = HEADER_FILL;
          cell.font = HEADER_FONT;
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          cell.border = {
            top: medium("FF1E40AF"),
            left: thin("FF3B82F6"),
            bottom: medium("FF93C5FD"),
            right: thin("FF3B82F6"),
          };
        });
      };

      const addTitleBlock = (sheet: ExcelJS.Worksheet, title: string, colCount: number) => {
        sheet.mergeCells(1, 1, 1, colCount);
        const t = sheet.getCell("A1");
        t.value = title;
        t.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
        t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        t.alignment = { vertical: "middle", horizontal: "center" };
        t.border = OUTER_BORDER;
        sheet.getRow(1).height = 34;

        sheet.mergeCells(2, 1, 2, colCount);
        const d = sheet.getCell("A2");
        d.value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}  |  Age of Study`;
        d.font = { italic: true, size: 10, color: { argb: "FF374151" } };
        d.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } };
        d.alignment = { vertical: "middle", horizontal: "center" };
        sheet.getRow(2).height = 20;
      };

      const getScoreColor = (score: number, hasData: boolean) => {
        if (!hasData) return "FFFAFAFA";
        if (score >= 80) return "FFDCFCE7";
        if (score >= 60) return "FFFEF9C3";
        return "FFFEE2E2";
      };
      const getRateColor = (rate: number) => {
        if (rate === 0) return "FFFAFAFA";
        if (rate >= 80) return "FFDCFCE7";
        if (rate >= 50) return "FFFEF9C3";
        return "FFFEE2E2";
      };

      // ── Sheet 1: Lớp học ───────────────────────────────────────────────────
      if ((reportType === "class" || reportType === "comprehensive") && classData.data) {
        const sheet = workbook.addWorksheet("Lớp học");
        const COL_COUNT = 10;

        addTitleBlock(sheet, "BẢNG THỐNG KÊ LỚP HỌC", COL_COUNT);

        // Column widths (no auto-header)
        const colWidths = [18, 8, 12, 8, 12, 16, 13, 13, 13, 18];
        colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

        // Header row at row 3
        const headerRow = sheet.getRow(3);
        const headers = ["Tên lớp", "Khối", "Năm học", "Sĩ số", "Điểm TB", "Hoàn thành (%)", "HS hoạt động", "% Hoạt động", "HS không HĐ", "Tiến độ (HT/Tổng)"];
        headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
        styleHeader(headerRow);

        const classes = classData.data.classes;
        classes.forEach((c, idx) => {
          const hasScoreData = c.completedNodes > 0;
          const activeRate = c.studentCount > 0 ? (c.activeStudents / c.studentCount) * 100 : 0;
          const rowBg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
          const isLast = idx === classes.length - 1;

          const row = sheet.getRow(idx + 4); // starts at row 4
          const values = [
            c.className,
            c.grade,
            c.schoolYear,
            c.studentCount,
            hasScoreData ? parseFloat(c.averageScore.toFixed(1)) : "-",
            hasScoreData ? parseFloat(c.completionRate.toFixed(1)) : "-",
            c.activeStudents,
            parseFloat(activeRate.toFixed(1)),
            c.studentCount - c.activeStudents,
            `${c.completedNodes}/${c.totalAssignedNodes}`,
          ];
          values.forEach((v, i) => { row.getCell(i + 1).value = v as ExcelJS.CellValue; });
          row.height = 22;

          row.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
            cell.alignment = { vertical: "middle", horizontal: col === 1 ? "left" : "center" };
          });

          // Color-code specific columns
          row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: getScoreColor(c.averageScore, hasScoreData) } };
          row.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: getRateColor(c.completionRate) } };
          row.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: getRateColor(activeRate) } };

          applyBorders(row, isLast);
        });

        // Summary row
        if (classes.length > 0) {
          const totalStudents = classes.reduce((s, c) => s + c.studentCount, 0);
          const totalActive = classes.reduce((s, c) => s + c.activeStudents, 0);
          const avgScore = classes.reduce((s, c) => s + c.averageScore, 0) / classes.length;
          const avgCompletion = classes.reduce((s, c) => s + c.completionRate, 0) / classes.length;
          const avgActiveRate = totalStudents > 0 ? (totalActive / totalStudents) * 100 : 0;
          const hasAnyScore = classes.some((c) => c.completedNodes > 0);

          const sumRow = sheet.getRow(classes.length + 4);
          const sumValues = [
            "TRUNG BÌNH TOÀN TRƯỜNG", "", "",
            totalStudents,
            hasAnyScore ? parseFloat(avgScore.toFixed(1)) : "-",
            hasAnyScore ? parseFloat(avgCompletion.toFixed(1)) : "-",
            totalActive,
            parseFloat(avgActiveRate.toFixed(1)),
            totalStudents - totalActive,
            "",
          ];
          sumValues.forEach((v, i) => { sumRow.getCell(i + 1).value = v as ExcelJS.CellValue; });
          sumRow.height = 24;
          sumRow.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
            cell.font = { bold: true };
            cell.alignment = { vertical: "middle", horizontal: col === 1 ? "left" : "center" };
            cell.border = { top: medium(), left: thin(), bottom: medium(), right: thin() };
          });
        }

        sheet.views = [{ state: "frozen", ySplit: 3 }];
      }

      // ── Sheet 2: Giáo viên ─────────────────────────────────────────────────
      if ((reportType === "teacher" || reportType === "comprehensive") && teacherData.data) {
        const sheet = workbook.addWorksheet("Giáo viên");
        const COL_COUNT = 10;

        addTitleBlock(sheet, "BẢNG THỐNG KÊ HOẠT ĐỘNG GIÁO VIÊN", COL_COUNT);

        const colWidths = [22, 28, 10, 14, 12, 10, 22, 16, 14, 16];
        colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

        const headerRow = sheet.getRow(3);
        const headers = ["Họ tên", "Email", "Tổng lớp", "Lớp CN", "Lớp BM", "Tổng HS", "Môn giảng dạy", "Trạng thái", "Ngày không HĐ", "Lần cuối HĐ"];
        headers.forEach((h, i) => { headerRow.getCell(i + 1).value = h; });
        styleHeader(headerRow);

        const teachers = teacherData.data.teachers;
        teachers.forEach((t, idx) => {
          const rowBg = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
          const isLast = idx === teachers.length - 1;
          const statusLabel = t.activityStatus === "active" ? "Hoạt động" :
            t.activityStatus === "inactive" ? "Không hoạt động" : "Chưa đăng nhập";
          const statusColor = t.activityStatus === "active" ? "FFDCFCE7" :
            t.activityStatus === "inactive" ? "FFFEF9C3" : "FFFEE2E2";

          const row = sheet.getRow(idx + 4);
          const values = [
            t.fullName || t.username || "N/A",
            t.email || "N/A",
            t.totalClasses,
            t.homeroomClasses,
            t.subjectClasses,
            t.totalStudents,
            t.subjects.join("; ") || "Chưa có",
            statusLabel,
            t.activityStatus === "never" ? "-" : t.daysInactive,
            t.lastActive ? new Date(t.lastActive).toLocaleDateString("vi-VN") : "Chưa bao giờ",
          ];
          values.forEach((v, i) => { row.getCell(i + 1).value = v as ExcelJS.CellValue; });
          row.height = 22;

          row.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
            cell.alignment = { vertical: "middle", horizontal: col <= 2 ? "left" : "center", wrapText: col === 7 };
          });
          row.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusColor } };
          row.getCell(8).font = { bold: true };

          applyBorders(row, isLast);
        });

        sheet.views = [{ state: "frozen", ySplit: 3 }];
      }

      // ── Sheet 3: Tổng quan ─────────────────────────────────────────────────
      if (reportType === "comprehensive" && classData.data && teacherData.data) {
        const sheet = workbook.addWorksheet("Tổng quan");

        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 18;
        sheet.getColumn(3).width = 14;

        // Main title
        sheet.mergeCells("A1:C1");
        const t = sheet.getCell("A1");
        t.value = "BÁO CÁO TỔNG HỢP HỆ THỐNG AGE OF STUDY";
        t.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
        t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        t.alignment = { vertical: "middle", horizontal: "center" };
        t.border = OUTER_BORDER;
        sheet.getRow(1).height = 38;

        sheet.mergeCells("A2:C2");
        const d = sheet.getCell("A2");
        d.value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`;
        d.font = { italic: true, size: 10, color: { argb: "FF374151" } };
        d.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } };
        d.alignment = { vertical: "middle", horizontal: "center" };
        sheet.getRow(2).height = 20;
        sheet.addRow([]);

        const addSection = (sectionTitle: string, rows: [string, string | number, string?][]) => {
          sheet.mergeCells(sheet.rowCount + 1, 1, sheet.rowCount + 1, 3);
          const hdrRow = sheet.addRow([sectionTitle]);
          const hdrCell = hdrRow.getCell(1);
          hdrCell.font = { bold: true, size: 11, color: { argb: "FF1E40AF" } };
          hdrCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
          hdrCell.alignment = { vertical: "middle", horizontal: "left" };
          hdrCell.border = { top: medium("FF93C5FD"), left: medium("FF93C5FD"), bottom: thin(), right: medium("FF93C5FD") };
          hdrRow.height = 26;

          rows.forEach(([label, value, note]) => {
            const row = sheet.addRow([label, value, note ?? ""]);
            row.height = 22;
            row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
            row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
            row.getCell(2).font = { bold: true };
            row.getCell(1).border = { ...CELL_BORDER, left: medium("FF93C5FD") };
            row.getCell(2).border = CELL_BORDER;
            row.getCell(3).border = { ...CELL_BORDER, right: medium("FF93C5FD") };
            row.getCell(3).font = { italic: true, color: { argb: "FF6B7280" }, size: 10 };
          });

          // bottom border for last row of section
          const lastRow = sheet.getRow(sheet.rowCount);
          [1, 2, 3].forEach((c) => {
            const cell = lastRow.getCell(c);
            cell.border = { ...cell.border, bottom: medium("FF93C5FD") };
          });
          sheet.addRow([]);
        };

        const cls = classData.data.summary;
        const tch = teacherData.data.summary;

        addSection("THỐNG KÊ LỚP HỌC", [
          ["Tổng số lớp đang hoạt động", cls.totalClasses, "lớp"],
          ["Tổng học sinh", cls.totalStudents, "học sinh"],
          ["Điểm trung bình toàn trường", cls.averageScore > 0 ? cls.averageScore.toFixed(1) : "Chưa có dữ liệu", ""],
          ["Tỷ lệ hoàn thành trung bình", cls.averageCompletion.toFixed(1) + "%", ""],
          ["Lớp xuất sắc nhất", cls.highestPerformingClass ?? "N/A", ""],
          ["Lớp cần cải thiện", cls.lowestPerformingClass ?? "N/A", ""],
        ]);

        addSection("THỐNG KÊ GIÁO VIÊN", [
          ["Tổng số giáo viên", tch.totalTeachers, "người"],
          ["Đang hoạt động (7 ngày qua)", tch.activeTeachers, "người"],
          ["Không hoạt động", tch.inactiveTeachers, "người"],
          ["Chưa bao giờ đăng nhập", tch.neverLoggedIn, "người"],
          ["Số lớp TB/giáo viên", tch.averageClassesPerTeacher.toFixed(1), "lớp/GV"],
        ]);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `bao-cao-${reportType}-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("Có lỗi khi tạo Excel: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Xuất báo cáo
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Tạo và xuất báo cáo tổng hợp cho Phòng Giáo dục
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Chọn loại báo cáo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType("comprehensive")}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === "comprehensive"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <School className="w-10 h-10 text-blue-600 mb-3 mx-auto" />
            <h3 className="font-bold text-gray-900 mb-1">Báo cáo tổng hợp</h3>
            <p className="text-sm text-gray-600">Bao gồm tất cả thống kê</p>
          </button>

          <button
            onClick={() => setReportType("class")}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === "class"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300"
            }`}
          >
            <BarChart3 className="w-10 h-10 text-green-600 mb-3 mx-auto" />
            <h3 className="font-bold text-gray-900 mb-1">Báo cáo lớp học</h3>
            <p className="text-sm text-gray-600">So sánh và thống kê lớp</p>
          </button>

          <button
            onClick={() => setReportType("teacher")}
            className={`p-6 rounded-lg border-2 transition-all ${
              reportType === "teacher"
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-purple-300"
            }`}
          >
            <GraduationCap className="w-10 h-10 text-purple-600 mb-3 mx-auto" />
            <h3 className="font-bold text-gray-900 mb-1">Báo cáo giáo viên</h3>
            <p className="text-sm text-gray-600">Hoạt động và tham gia</p>
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Định dạng xuất</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={generatePDFReport}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
            <div className="text-left">
              <div className="font-bold text-lg">Xuất PDF</div>
              <div className="text-sm text-red-100">Định dạng văn bản cố định</div>
            </div>
          </button>

          <button
            onClick={generateExcelReport}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-6 h-6" />
            )}
            <div className="text-left">
              <div className="font-bold text-lg">Xuất Excel</div>
              <div className="text-sm text-green-100">Định dạng bảng tính</div>
            </div>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Lưu ý</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Báo cáo được tạo dựa trên dữ liệu thời gian thực</li>
              <li>• PDF phù hợp cho văn bản chính thức và in ấn</li>
              <li>• Excel cho phép phân tích và xử lý dữ liệu thêm</li>
              <li>• Báo cáo tổng hợp bao gồm cả thống kê lớp học và giáo viên</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { TestWithQuestions } from "@/types/test";

export interface ExportTestOptions {
  schoolName?: string;
  authorityName?: string;
  showAnswers?: boolean;
}

export class PDFExporter {
  private static async loadFonts() {
    const [regularBytes, boldBytes] = await Promise.all([
      fetch("/fonts/BeVietnamPro-Regular.ttf").then((r) => {
        if (!r.ok) throw new Error(`Failed to load Regular font: ${r.status}`);
        return r.arrayBuffer();
      }),
      fetch("/fonts/BeVietnamPro-Bold.ttf").then((r) => {
        if (!r.ok) throw new Error(`Failed to load Bold font: ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);
    return { regularBytes, boldBytes };
  }

  static async exportTestToPDF(test: TestWithQuestions, options: ExportTestOptions = {}) {
    const {
      schoolName = "TRƯỜNG TIỂU HỌC NINH LAI",
      authorityName = "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO",
      showAnswers = false
    } = options;

    const { regularBytes, boldBytes } = await this.loadFonts();

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(regularBytes, { subset: true });
    const boldFont = await pdfDoc.embedFont(boldBytes, { subset: true });

    const PAGE_W = 595;
    const PAGE_H = 842;
    const MX = 55;
    const MT = 50;
    const MB = 50;
    const CW = PAGE_W - MX * 2;
    
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MT;

    const ensurePage = (needed: number) => {
      if (y - needed < MB) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MT;
        // Optionally redraw header on new pages if needed
      }
    };

    const drawText = (text: string, x: number, opts: { size?: number; isBold?: boolean; color?: [number, number, number] } = {}) => {
      const { size = 11, isBold = false, color = [0, 0, 0] } = opts;
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? boldFont : font,
        color: rgb(color[0], color[1], color[2]),
      });
    };

    const drawLine = (thickness = 0.5) => {
      page.drawLine({
        start: { x: MX, y },
        end: { x: PAGE_W - MX, y },
        thickness,
        color: rgb(0.8, 0.8, 0.8)
      });
    };

    // Header
    drawText(authorityName, MX, { size: 10 });
    const motto = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
    const mottoW = boldFont.widthOfTextAtSize(motto, 10);
    drawText(motto, PAGE_W - MX - mottoW, { size: 10, isBold: true });
    y -= 15;

    drawText(schoolName, MX, { size: 10, isBold: true });
    const subMotto = "Độc lập - Tự do - Hạnh phúc";
    const subMottoW = font.widthOfTextAtSize(subMotto, 10);
    drawText(subMotto, PAGE_W - MX - mottoW + (mottoW - subMottoW) / 2, { size: 10 });
    y -= 5;
    
    // Line under school name
    const snW = boldFont.widthOfTextAtSize(schoolName, 10);
    page.drawLine({ start: { x: MX, y }, end: { x: MX + snW, y }, thickness: 0.8 });
    page.drawLine({ start: { x: PAGE_W - MX - mottoW + (mottoW - subMottoW) / 2, y }, end: { x: PAGE_W - MX - mottoW + (mottoW - subMottoW) / 2 + subMottoW, y }, thickness: 0.8 });
    
    y -= 40;

    // Title
    const title = test.title.toUpperCase();
    const titleSize = 16;
    const titleW = boldFont.widthOfTextAtSize(title, titleSize);
    drawText(title, (PAGE_W - titleW) / 2, { size: titleSize, isBold: true });
    y -= 25;

    if (test.description) {
      const descSize = 10;
      const descW = font.widthOfTextAtSize(test.description, descSize);
      drawText(test.description, (PAGE_W - descW) / 2, { size: descSize });
      y -= 15;
    }
    
    y -= 10;
    drawLine(1);
    y -= 30;

    // Student Info Block
    drawText("Họ và tên thí sinh: ...................................................................................", MX, { size: 11 });
    y -= 20;
    drawText("Số báo danh: ................................. lớp: ...................................................", MX, { size: 11 });
    y -= 30;

    // Questions
    test.questions.forEach((q, index) => {
      const qText = `Câu ${index + 1}: ${q.content.questionText}`;
      
      // Basic word wrap logic
      const words = qText.split(' ');
      let currentLine = "";
      const lines: string[] = [];
      
      words.forEach(word => {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (font.widthOfTextAtSize(testLine, 11) > CW) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);

      ensurePage(lines.length * 15 + 60);

      lines.forEach(line => {
        drawText(line, MX, { size: 11, isBold: true });
        y -= 15;
      });
      y -= 5;

      if (q.content.type === 'MULTIPLE_CHOICE' || q.content.type === 'TRUE_FALSE') {
        const options = q.content.options as any[];
        options.forEach((opt, optIdx) => {
          const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D
          const optText = typeof opt === 'string' ? opt : opt.text;
          const fullOpt = `${optLabel}. ${optText}`;
          
          ensurePage(20);
          drawText(fullOpt, MX + 20, { size: 10 });
          
          if (showAnswers && (typeof opt !== 'string' && opt.isCorrect)) {
            const checkW = font.widthOfTextAtSize(fullOpt, 10);
            drawText(" (Đáp án đúng)", MX + 20 + checkW + 5, { size: 10, color: [0.8, 0, 0] });
          }
          y -= 15;
        });
      } else if (q.content.type === 'ESSAY') {
        y -= 5;
        for (let i = 0; i < 6; i++) {
          ensurePage(20);
          page.drawLine({
            start: { x: MX + 20, y },
            end: { x: PAGE_W - MX, y },
            thickness: 0.3,
            dashArray: [2, 2],
            color: rgb(0.6, 0.6, 0.6)
          });
          y -= 18;
        }
      }
      y -= 10;
    });

    // Footer with page numbers
    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((p, i) => {
      const footerText = `Trang ${i + 1} / ${totalPages}`;
      const fw = font.widthOfTextAtSize(footerText, 8);
      p.drawText(footerText, {
        x: (PAGE_W - fw) / 2,
        y: 25,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  static downloadPDF(pdfBytes: Uint8Array, fileName: string) {
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

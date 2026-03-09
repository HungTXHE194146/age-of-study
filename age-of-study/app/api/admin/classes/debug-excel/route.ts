import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const p = "C:/Users/kythu/Downloads/PHAN_CONG_CHU_NHIEM_HOCKY_1_NAMHOC_20252026.xlsx";
    if (!fs.existsSync(p)) return NextResponse.json({ error: "File not found" });

    const workbook = XLSX.readFile(p);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return NextResponse.json({
      length: data.length,
      rows: (data as any[][]).slice(0, 15)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}

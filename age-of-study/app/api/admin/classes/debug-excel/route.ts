import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as fs from "fs";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const p = searchParams.get("path") || process.env.DEBUG_EXCEL_PATH;

    if (!p) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    if (!fs.existsSync(p)) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const workbook = XLSX.readFile(p);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    return NextResponse.json({
      length: data.length,
      rows: (data as any[][]).slice(0, 15)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

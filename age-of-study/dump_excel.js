const XLSX = require("xlsx");
const fs = require("fs");

try {
    const p = "C:/Users/kythu/Downloads/PHAN_CONG_CHU_NHIEM_HOCKY_1_NAMHOC_20252026.xlsx";
    const workbook = XLSX.readFile(p);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    fs.writeFileSync("d:/ForWork/AgeOfStudy/code/age-of-study/age-of-study/excel_debug.json", JSON.stringify({
        length: data.length,
        rows: data.slice(0, 15)
    }, null, 2));
    console.log("Done");
} catch (err) {
    fs.writeFileSync("d:/ForWork/AgeOfStudy/code/age-of-study/age-of-study/excel_debug.json", JSON.stringify({ error: err.message }));
}

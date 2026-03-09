const XLSX = require("xlsx");
const fs = require("fs");

try {
    const filePaths = [
        "C:/Users/kythu/Downloads/PHAN_CONG_CHU_NHIEM_HOCKY_1_NAMHOC_20252026.xlsx",
        "C:/Users/kythu/Downloads/PHAN CONG CHU NHIEM HOCKY 1 NAMHOC 20252026.xlsx"
    ];
    let workbook;
    for (const p of filePaths) {
        if (fs.existsSync(p)) {
            workbook = XLSX.readFile(p);
            console.log("Loaded:", p);
            break;
        }
    }

    if (!workbook) {
        console.log("File not found in paths");
        process.exit(1);
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
    });

    console.log("Total rows:", jsonData.length);
    console.log("Row 6:", jsonData[5]);
    console.log("Row 7:", jsonData[6]);
    console.log("Row 8:", jsonData[7]);
    console.log("Row 9:", jsonData[8]);

} catch (err) {
    console.error(err);
}

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

try {
    const inputPath = process.argv[2];
    if (!inputPath) {
        console.error("Usage: node test_excel.js <path-to-excel-file>");
        process.exit(1);
    }
    const resolvedPath = path.resolve(inputPath);

    if (!fs.existsSync(resolvedPath)) {
        console.log("File not found at path:", resolvedPath);
        process.exit(1);
    }

    let workbook = XLSX.readFile(resolvedPath);
    console.log("Loaded:", resolvedPath);

    if (!workbook.SheetNames.length) {
        console.error("Workbook has no sheets");
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

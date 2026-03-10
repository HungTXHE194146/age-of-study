const XLSX = require("xlsx");
const fs = require("fs");

try {
    const XLSX = require("xlsx");
    const fs = require("fs");
    const path = require("path");

    const inputPath = process.argv[2];
    if (!inputPath) {
        console.error("Usage: node dump_excel.js <path-to-excel-file>");
        process.exit(1);
    }

    try {
        const workbook = XLSX.readFile(inputPath);
        const workbook = XLSX.readFile(p);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const outPath = path.join(__dirname, "excel_debug.json");
        fs.writeFileSync(outPath, JSON.stringify({
            length: data.length,
            rows: data.slice(0, 15)
        }, null, 2));
        console.log("Done");
    } catch (err) {
        const errPath = path.join(__dirname, "excel_debug.json");
        fs.writeFileSync(errPath, JSON.stringify({ error: err.message }));
    }

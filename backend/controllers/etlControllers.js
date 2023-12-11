const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const XLSX = require("xlsx");
const fs = require("fs");
const mongoXlsx = require("mongo-xlsx");
const mongoose = require("mongoose");
const EnrETL = require("../model/enrichedData");
const { parseString } = require("xml2js");
const xml2js = require("xml2js");
const util = require("util");
const csv = require("csvtojson");
const SumETL = require("../model/sumData");
const CatETL = require("../model/categData");

exports.etlData = catchAsyncErrors(async (req, res) => {
  //variables
  const excelFile = req.body.excelFile.file;
  const csvFile = req.body.csvFile;
  const xmlFile = req.body.xmlFile;
  const mode = req.body.mode;
  var jsonDataPro = [];
  var xmlData;

  try {
    // ************************************************ EXTRACTION

    //converting data to json and merging
    if (excelFile) {
      const worksheet = excelFile;
      jsonDataPro = XLSX.utils.sheet_to_json(worksheet);
    }
    if (xmlFile) {
      const parser = new xml2js.Parser();
      fs.readFile("./controllers/ordersheet.xml", (err, data) => {
        if (err) {
          console.error("Error reading XML file:", err);
          return;
        }

        parser.parseString(data, (err, result) => {
          if (err) {
            console.error("Error parsing XML:", err);
            return;
          }

          const headerRow = result["ss:Table"]["Row"][0]["Cell"].map(
            (cell) => cell["Data"][0]["_"]
          );

          const rows = result["ss:Table"]["Row"].slice(1).map((row) => {
            const rowData = {};
            row["Cell"].forEach((cell, index) => {
              const key = headerRow[index];
              const value =
                cell["Data"][0]["$"]["ss:Type"] === "Number"
                  ? parseFloat(cell["Data"][0]["_"])
                  : cell["Data"][0]["_"];
              rowData[key] = value;
            });
            return rowData;
          });

          xmlData = rows;
          const finalData = rows;
          jsonDataPro = [...jsonDataPro, ...xmlData];

          // / Create a new workbook and add a worksheet
          const newWorkbook = XLSX.utils.book_new();
          const newWorksheet = XLSX.utils.json_to_sheet(jsonDataPro);

          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

          XLSX.writeFile(newWorkbook, "merged.xlsx");
        });
      });
    }
    if (csvFile) {
      csv()
        .fromString(csvFile)
        .then((jsonArrayObj) => {
          jsonDataPro = [...jsonDataPro, ...jsonArrayObj];
          const newWorkbook = XLSX.utils.book_new();
          const newWorksheet = XLSX.utils.json_to_sheet(jsonDataPro);

          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");

          XLSX.writeFile(newWorkbook, "merged.xlsx");
        })
        .catch((err) => {
          console.error(err);
        });
    }

    // ************************************************** TRANSFORM FUNCTIONS

    // ============== SUMMARIZATION ==============
    function summarizeData(data) {
      console.log("Summarise func executed");
      const summary = {};
      data.forEach((row) => {
        const category = row.Category;
        if (!summary[category]) {
          summary[category] = {
            totalSales: 0,
            totalProfit: 0,
            // You can add more summary fields as needed
          };
        }

        // Assuming Sales and Profit are numeric fields in your data
        summary[category].totalSales += parseFloat(row.Sales);
        summary[category].totalProfit += parseFloat(row.Profit);
      });

      return summary;
    }
    // ============== ENRICHMENT ==============
    function enrichData(data) {
      data.forEach((row) => {
        if (row.Category === "Office Supplies") {
          row.EnrichedField = "High Demand";
        } else {
          row.EnrichedField = "Normal Demand";
        }
      });

      const enrichedWorksheet = XLSX.utils.json_to_sheet(data);

      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        newWorkbook,
        enrichedWorksheet,
        "EnrichedSheet"
      );

      XLSX.writeFile(newWorkbook, "enriched_excel_file.xlsx", {
        bookSST: true,
      });
      console.log("Modified Excel file created: modified_excel_file.xlsx");
    }
    // ============== CATEGORIZED ==============

    function categorizeSales(sales) {
      if (sales > 1000) {
        return "High Sales";
      } else if (sales > 500) {
        return "Medium Sales";
      } else {
        return "Low Sales";
      }
    }

    if (mode === "summarise") {
      // Read data from the Excel file
      const workbook = XLSX.readFile("merged.xlsx");
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonDataMerged = XLSX.utils.sheet_to_json(worksheet);
      const resultSummary = summarizeData(jsonDataMerged);

      console.log(resultSummary); //returning the total sales and profit w.r.t categories

      const summaryArray = Object.keys(resultSummary).map((category) => ({
        Category: category,
        totalSales: resultSummary[category].totalSales,
        totalProfit: resultSummary[category].totalProfit,
      }));

      // Create a worksheet from the summary data
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryArray);

      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        newWorkbook,
        summaryWorksheet,
        "SummarySheet"
      );

      XLSX.writeFile(newWorkbook, "summary_excel_file.xlsx", { bookSST: true });

      // Read data from the Excel file
      const workbookS = XLSX.readFile("summary_excel_file.xlsx");
      const sheetNameS = workbookS.SheetNames[0];
      const worksheetS = workbookS.Sheets[sheetNameS];
      const jsonDataMergedS = XLSX.utils.sheet_to_json(worksheetS);
      loadSummariseddData();
      res
        .status(200)
        .json({ success: true, mode: "summarised", data: jsonDataMergedS });
    } else if (mode == "categorised") {
      // Read data from the Excel file
      const workbook = XLSX.readFile("merged.xlsx");
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonDataMerged = XLSX.utils.sheet_to_json(worksheet);
      // Apply categorization to the JSON data
      const categorizedData = jsonDataMerged.map((row) => {
        const salesCategory = categorizeSales(row.Sales);
        return { ...row, SalesCategory: salesCategory };
      });
      // Convert categorized data to worksheet

      const categorizedWorksheet = XLSX.utils.json_to_sheet(categorizedData);

      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        newWorkbook,
        categorizedWorksheet,
        "CategorizedSheet"
      );

      XLSX.writeFile(newWorkbook, "categorized_excel_file.xlsx", {
        bookSST: true,
      });

      // Read data from the Excel file
      const workbookC = XLSX.readFile("categorized_excel_file.xlsx");
      const sheetNameC = workbookC.SheetNames[0];
      const worksheetC = workbookC.Sheets[sheetNameC];
      const jsonDataMergedC = XLSX.utils.sheet_to_json(worksheetC);
      loadCategorisedData();
      res
        .status(200)
        .json({ success: true, mode: "categorised", data: jsonDataMergedC });
    } else if (mode == "enriched") {
      // Read data from the Excel file
      const workbook = XLSX.readFile("merged.xlsx");
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonDataMerged = XLSX.utils.sheet_to_json(worksheet);
      enrichData(jsonDataMerged);

      // Read data from the Excel file
      const workbookE = XLSX.readFile("enriched_excel_file.xlsx");
      const sheetNameE = workbookE.SheetNames[0];
      const worksheetE = workbookE.Sheets[sheetNameE];
      const jsonDataMergedE = XLSX.utils.sheet_to_json(worksheetE);
      loadEnrichedData();
      res
        .status(200)
        .json({ success: true, mode: "enriched", data: jsonDataMergedE });
    }
  } catch (err) {
    console.log(err);
  }
});

// ************************************************** LOAD FUNCTIONS
const loadEnrichedData = async () => {
  try {
    // Load the modified workbook
    var enrichedWorkbook = XLSX.readFile("enriched_excel_file.xlsx");
    const enrichedsheetName = enrichedWorkbook.SheetNames[0];
    const enrichedworksheet = enrichedWorkbook.Sheets[enrichedsheetName];
    const enrichedjsonData = XLSX.utils.sheet_to_json(enrichedworksheet);
    enrichedjsonData.map(async (item, index) => {
      var etl = await EnrETL.create(item);
      console.log(etl);
    });
  } catch (err) {
    console.log(err);
  }
};

const loadSummariseddData = async () => {
  try {
    // Load the modified workbook
    var summarisedWorkbook = XLSX.readFile("summary_excel_file.xlsx");
    const summarisedsheetName = summarisedWorkbook.SheetNames[0];
    const summarisedworksheet = summarisedWorkbook.Sheets[summarisedsheetName];
    const summarisedjsonData = XLSX.utils.sheet_to_json(summarisedworksheet);
    summarisedjsonData.map(async (item, index) => {
      var etl = await SumETL.create(item);
      console.log(etl);
    });
  } catch (err) {
    console.log(err);
  }
};

const loadCategorisedData = async () => {
  try {
    // Load the modified workbook
    var categorisedWorkbook = XLSX.readFile("categorized_excel_file.xlsx");
    const categorisedsheetName = categorisedWorkbook.SheetNames[0];
    const categorisedworksheet =
      categorisedWorkbook.Sheets[categorisedsheetName];
    const categorisedjsonData = XLSX.utils.sheet_to_json(categorisedworksheet);
    categorisedjsonData.map(async (item, index) => {
      var etl = await CatETL.create(item);
      console.log(etl);
    });
  } catch (err) {
    console.log(err);
  }
};

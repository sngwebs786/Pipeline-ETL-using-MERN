import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import * as XLSX from "xlsx";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Snackbar } from "@mui/material";
import MuiAlert from "@mui/material/Alert";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FolderIcon from "@mui/icons-material/Folder";
import "./App.css";
import DeleteIcon from "@mui/icons-material/Delete";
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// TABLE CODE
const columns = [
  { id: "name", label: "Name", minWidth: 170 },
  { id: "code", label: "ISO\u00a0Code", minWidth: 100 },
  {
    id: "population",
    label: "Population",
    minWidth: 170,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "size",
    label: "Size\u00a0(km\u00b2)",
    minWidth: 170,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "density",
    label: "Density",
    minWidth: 170,
    align: "right",
    format: (value) => value.toFixed(2),
  },
];

function createData(name, code, population, size) {
  const density = population / size;
  return { name, code, population, size, density };
}

const rows = [
  createData("India", "IN", 1324171354, 3287263),
  createData("China", "CN", 1403500365, 9596961),
  createData("Italy", "IT", 60483973, 301340),
  createData("United States", "US", 327167434, 9833520),
  createData("Canada", "CA", 37602103, 9984670),
  createData("Australia", "AU", 25475400, 7692024),
  createData("Germany", "DE", 83019200, 357578),
  createData("Ireland", "IE", 4857000, 70273),
  createData("Mexico", "MX", 126577691, 1972550),
  createData("Japan", "JP", 126317000, 377973),
  createData("France", "FR", 67022000, 640679),
  createData("United Kingdom", "GB", 67545757, 242495),
  createData("Russia", "RU", 146793744, 17098246),
  createData("Nigeria", "NG", 200962417, 923768),
  createData("Brazil", "BR", 210147125, 8515767),
];
// TABLE CODE
//snackbar
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App = () => {
  //handling file
  const [dense, setDense] = React.useState(false);
  const [secondary, setSecondary] = React.useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ExcelFile, setSelectExcelFile] = useState(null);
  const [tableColumns, setTableColumns] = useState(null);
  const [XmlFile, setSelectXmlFile] = useState(null);
  const [CsvFile, setSelectCsvFile] = useState(null);
  const [jsonResponseData, setJsonResponseData] = useState(null);
  const [totalFiles, setTotalFiles] = useState([]);
  const [mode, setMode] = useState(null);
  const handleFileChange = (event) => {
    try {
      setTotalFiles([...totalFiles, event.target.files[0].name]);

      const file = event.target.files[0];
      var extension = event.target.files[0].type;
      if (
        extension ==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        console.log("excel file uploaded");
        const reader = new FileReader();

        reader.onload = (e) => {
          const data = e.target.result;

          // Read the Excel file
          const workbook = XLSX.read(data, { type: "binary" });

          // Assuming the first sheet of the workbook contains the data
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          var fileDetails = {
            file: sheet,
            extension: "excel",
          };

          setSelectedFile(fileDetails);
          setSelectExcelFile(fileDetails);
        };

        reader.readAsBinaryString(file);
      } else if (extension == "text/xml") {
        console.log("extension", extension);
        const reader = new FileReader();

        reader.onload = (e) => {
          const data = e.target.result;

          // Send the file content to the backend
          setSelectedFile(data);
          setSelectXmlFile(data);
        };

        reader.readAsArrayBuffer(file);

        console.log("xml file", XmlFile);
      } else if (extension === "text/csv") {
        console.log("CSV file uploaded");
        const reader = new FileReader();

        reader.onload = (e) => {
          const data = e.target.result;

          // Send the CSV file content to the backend
          setSelectedFile(data);
          setSelectCsvFile(data);
        };

        reader.readAsText(file);

        console.log("CSV file", CsvFile);
      }
    } catch (err) {
      console.log(err);
    }
  };

  //snackbar//
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSnackbarClick = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };
  //snackbar//

  const Transform = async (typeOfOperation) => {
    if (!selectedFile) {
      handleSnackbarClick();
    } else {
      try {
        const sendData = {
          mode: typeOfOperation,
          file: selectedFile,
          excelFile: ExcelFile,
          xmlFile: XmlFile,
          csvFile: CsvFile,
        };
        const res = await fetch("http://localhost:5000/api/v1/etlData", {
          method: "POST",
          headers: {
            Accept: "application.json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendData),
        });
        const response = await res.json();
        // console.log(response.data);
        setMode(response.mode);
        setJsonResponseData(response.data);
        if (jsonResponseData) {
          setTableColumns(Object.keys(jsonResponseData[0]));
          if (tableColumns) {
            console.log("table col:", tableColumns);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div>
      <div>
        <center>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity="error"
              sx={{ width: "100%" }}
            >
              Sorry! File not found, Try again
            </Alert>
          </Snackbar>
          <Button
            style={{ margin: "10px" }}
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
          >
            Upload file
            <VisuallyHiddenInput type="file" onChange={handleFileChange} />
          </Button>

          {totalFiles ? (
            <div className="filesList">
              {totalFiles.map((item, index) => {
                return (
                  <ListItem key={index} className="listItem">
                    <ListItemText
                      primary={item}
                      secondary={secondary ? "Secondary text" : null}
                    />
                  </ListItem>
                );
              })}
            </div>
          ) : (
            <></>
          )}

          <br />

          <Button
            onClick={() => Transform("summarise")}
            color="success"
            style={{ margin: "10px" }}
            variant="contained"
          >
            Summarize
          </Button>
          <Button
            onClick={() => Transform("categorised")}
            color="secondary"
            style={{ margin: "10px" }}
            variant="contained"
          >
            Categorize
          </Button>
          <Button
            onClick={() => Transform("enriched")}
            color="error"
            style={{ margin: "10px" }}
            variant="contained"
          >
            Enrichment
          </Button>
        </center>
      </div>

      {/* // TABLE CODE */}
      {jsonResponseData && tableColumns ? (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {tableColumns.map((column, index) => (
                    <TableCell
                      key={index}
                      // align={column.align}
                      style={{ fontWeight: "bold" }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {jsonResponseData.map((item, index) => {
                  return (
                    <TableRow>
                      {Object.keys(item).map((subItem, subIndex) => {
                        return <TableCell>{item[subItem]}</TableCell>;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <>
          <center>
            <br />
            <h2>Please select any operation to see the data</h2>
          </center>
        </>
      )}
    </div>
  );
};

export default App;

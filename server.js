const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// DB connection
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bus_traking"
});

conn.connect((err) => {
  if (err) {
    console.error("DB connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + conn.threadId);
});

// API: Get bus assigned to driver
app.get("/driver-bus/:username", (req, res) => {
  const { username } = req.params;

  // Example: driver table has username → id, bus table has driver_id
  const sql = `
    SELECT bus.bus_name 
    FROM bus 
    JOIN driver ON bus.driver_id = driver.id
    WHERE driver.username = ? 
    LIMIT 1
  `;

  conn.query(sql, [username], (err, result) => {
    if (err) {
      console.error("Error fetching bus:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length > 0) {
      res.json({ busName: result[0].bus_name });
    } else {
      res.json({ busName: null });
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

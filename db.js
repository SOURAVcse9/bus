// Install mysql2 first: npm install mysql2

const mysql = require('mysql2');

// Create connection
const conn = mysql.createConnection({
  host: 'localhost',      // usually localhost
  user: 'root',           // your MySQL username
  password: '',           // your MySQL password
  database: 'bus_traking' // your database name
});

// Connect to database
conn.connect((err) => {
  if (err) {
    console.error('Connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + conn.threadId);
});

// Example query
// conn.query('SELECT * FROM bus', (err, results) => {
//     if (err) throw err;
//     console.log(results);
// });

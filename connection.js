const mysql = require("mysql");
const mysqlConnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "id14039977_srms",
  port: 3306,
  multipleStatements: true,
});
module.exports = mysqlConnection;

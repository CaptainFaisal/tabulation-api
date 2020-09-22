const express = require("express");
const mysqlConnection = require("./connection");
const bodyPerser = require("body-parser");
const cors = require("cors");
const app = express();
let subjects = null;
app.use(bodyPerser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

mysqlConnection.connect((err) => {
  if (!err) {
    console.log("Connected!");
  } else {
    console.log("Error in connection");
  }
});

mysqlConnection.query(
  `SELECT SubjectName FROM tblsubjectcombination sc
JOIN tblsubjects s
ON s.id = sc.SubjectId
ORDER BY SubjectCode`,
  (err, rows, fields) => {
    if (!err) {
      subjects = rows;
    } else {
      console.log("Error1");
    }
  }
);
app.get("/subjects", (req, res) => {
  res.send(subjects);
});

app.get("/students/:class/:section/:gender", (req, res) => {
  let queryRepeatArray = [];
  for (i = 0; i < subjects.length; i++) queryRepeatArray[i] = i + 1;
  const query = `SELECT Name,Roll,
  ${queryRepeatArray
    .map(
      (n) => `MAX(CASE WHEN SubjectSequence = 'Sub${n}' THEN marks END) Sub${n},
                MAX(CASE WHEN SubjectSequence = 'Sub${n}' THEN MCQ END) MCQ${n},
                MAX(CASE WHEN SubjectSequence = 'Sub${n}' THEN Practical END) Practical${n},
                MAX(CASE WHEN SubjectSequence = 'Sub${n}' THEN total END) 'Total${n}',
                MAX(CASE WHEN SubjectSequence = 'Sub${n}' THEN gpa END) 'GradePoints${n}',`
    )
    .join("\n")}SUM(marks) AS 'TotalMarks',
        AVG(gpa) AS GPA
        FROM
        (SELECT Name, Roll, SubjectId, Section, Gender, marks, MCQ, Practical,  CASE WHEN total BETWEEN 80 AND 100 THEN 5
        WHEN total BETWEEN 70 AND 79 THEN 4
        WHEN total BETWEEN 60 AND 69 THEN 3.5
        WHEN total BETWEEN 50 AND 59 THEN 3
        WHEN total BETWEEN 40 AND 49 THEN 2 
        WHEN total BETWEEN 33 AND 39 THEN 1
        WHEN total BETWEEN 0 AND 32 THEN 0
        END AS gpa, Subject, StudentId, ClassName, ClassNameNumeric, SubjectSequence, total
        FROM
        (SELECT Name,Roll,t1.SubjectId,Section,Gender,r.marks,r.MCQ,r.Practical,(r.marks+r.MCQ+r.Practical) AS total,s.SubjectName AS Subject,t1.StudentId,t1.ClassName,t1.ClassNameNumeric,CONCAT('Sub',CAST(ROW_NUMBER() OVER(PARTITION BY t1.StudentId ORDER BY s.SubjectCode) AS CHAR))SubjectSequence
      
        FROM
        (SELECT st.StudentName AS Name,st.RollId AS Roll,sc.SubjectId,c.Section,st.Gender,st.StudentId,c.ClassName,c.ClassNameNumeric
        FROM tblstudents st
        JOIN tblclasses c
        ON c.id = st.ClassId
        JOIN tblsubjectcombination sc
        USING(ClassId)
        )t1
        JOIN tblsubjects s
        ON t1.SubjectId = s.id
        LEFT JOIN tblresult r
        ON t1.SubjectId = r.SubjectId AND t1.StudentId = r.StudentId
      )t2
      )t3
        WHERE Section = '${req.params.section}' AND Gender = '${
    req.params.gender
  }' AND ClassNameNumeric = ${req.params.class}
        GROUP BY StudentId`;
  mysqlConnection.query(query, (err, rows, fields) => {
    if (!err) {
      res.send(rows);
      console.log(query);
    } else {
      console.log("Error2");
    }
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

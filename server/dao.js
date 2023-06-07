'use strict';

const sqlite = require('sqlite3');

// open database
const db = new sqlite.Database('courses.db', (err) => {
  if (err) throw err;
});

//get all courses
exports.listCourses = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT code, nome, crediti, maxStudenti, COUNT(DISTINCT studentId) AS iscritti, propedeuticita FROM courses LEFT OUTER JOIN studyPlane ON code=courseCode GROUP BY code ORDER BY nome';
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const courses = rows.map((c) => (
        {
          code: c.code,
          nome: c.nome,
          crediti: c.crediti,
          maxStudenti: c.maxStudenti,
          iscritti: c.iscritti,
          propedeuticita: c.propedeuticita
        }));
      resolve(courses);
    });
  });
};

// get incompatibilities for a course
exports.getIncompatibilitaByCourse = (code) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM incompatibility WHERE ? IN (course1, course2)';
    db.all(query, [code], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      if (rows.length === 0) {
        const code1 = '';
        resolve({ code1 }); //0 incompatibilita
      } else {
        const courses = rows.map((e) => (
          {
            code1: e.course1,
            code2: e.course2
          }));
        courses.forEach(course => { code === course.code1 ? delete course.code1 : delete course.code2 });
        const corsi = courses.map((code) => ({
          code: code.code1 ? code.code1 : code.code2
        })).map((c) => c.code);
        resolve(corsi);
      }
    });
  });
};

//get course by code
exports.getCourse = (code) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM courses WHERE code=?';
    db.get(query, [code], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve(null);
      } else {
        const course = {
          code: row.code,
          nome: row.nome,
          crediti: row.crediti,
          maxStudenti: row.maxStudenti,
          propedeuticita: row.propedeuticita
        };
        resolve(course);
      }
    });
  });
};

//get course by code and studentId
exports.checkExistingCourse = (code, studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT courseCode FROM studyPlane WHERE courseCode=? AND studentId=?';
    db.get(query, [code, studentId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

//add a Course to a StudyPlane    -> nuova riga in studyPlane
exports.addCourseStudyPlane = (code, studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO studyPlane(courseCode, studentId) values(?,?)';
    const parameters = [code, studentId];
    db.run(query, parameters, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
};

// delete a Course from a StudyPlane        
exports.deleteCourse = (code, studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM studyPlane WHERE courseCode = ? AND studentId=?';
    db.run(query, [code, studentId], (err) => {
      if (err) {
        reject(err);
        return;
      } else
        resolve(null);
    });
  });
};

//get study plane by studentId
exports.getStudyPlane = (studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT c.code AS code, c.nome AS nome, c.crediti AS crediti, c.maxStudenti AS maxStudenti, c.propedeuticita AS propedeuticita FROM courses c, studyPlane s WHERE c.code=s.courseCode AND s.studentId=?';
    db.all(query, [studentId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const courses = rows.map((c) => (
        {
          code: c.code,
          nome: c.nome,
          crediti: c.crediti,
          maxStudenti: c.maxStudenti,
          propedeuticita: c.propedeuticita
        }));
      resolve(courses);
    });
  });
};

// delete a StudyPlane        
exports.deleteStudyPlane = (studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM infoStudyPlane WHERE studentId=?';
    db.run(query, [studentId], (err) => {
      if (err) {
        reject(err);
        return;
      } else
        resolve(null);
    });
  });
};

//get study plane by studentId
exports.existingStudyPlane = (studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM infoStudyPlane WHERE studentId=?';
    db.get(query, [studentId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row === undefined) {
        resolve(false);
      }
      resolve(true);
    });
  });
};

// aggiorno crediti piano di studi
exports.updateCreditiStudyPlane = (crediti, studentId) => {
  return new Promise((resolve, reject) => {
    const query = "UPDATE infoStudyPlane SET crediti=? WHERE studentId = ?";
    db.run(query, [crediti, studentId], function (err) {
      if (err) {
        reject(err);
        return;
      }
      if (this.changes === 0) reject("operation failed");
      resolve(this.lastID);
    });
  });
};

//get crediti study plane by studentId
exports.getCreditiStudyPlane = (studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT crediti FROM infoStudyPlane WHERE studentId=?';
    db.get(query, [studentId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Study plane not found' });
      } else {
        resolve(row);
      }
    });
  });
};

// get type of a studyplane
exports.getTipologiaStudyPlane = (studentId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT tipologia FROM infoStudyPlane WHERE studentId=?';
    db.get(query, [studentId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Study plane not found' });
      } else {
        resolve(row);
      }
    });
  });
};

// setto la tipologia alla creazione di un nuovo piano di studi
exports.setTipologiaStudyPlane = (tipologia, studentId) => {
  return new Promise((resolve, reject) => {
    const query = "INSERT INTO infoStudyPlane(studentId,tipologia,crediti) VALUES(?,?,0)";
    const parameters = [studentId, tipologia];
    db.run(query, parameters, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
};


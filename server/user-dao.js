'use strict';

const sqlite = require('sqlite3');
const crypto = require('crypto');

// open database
const db = new sqlite.Database('courses.db', (err) => {
  if (err) throw err;
});

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM students WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'Student not found.' });
      else {
        // by default, the local strategy looks for "username": 
        // not to create confusion in server.js, we can create an object with that property
        const student = { id: row.id, username: row.email, name: row.name }
        resolve(student);
      }
    });
  });
};

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM students WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        const student = { id: row.id, username: row.email, name: row.name };
        const salt = row.salt;
        crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
          if (err) reject(err);
          const passwordHex = Buffer.from(row.password, 'hex');
          if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false); 
          else resolve(student);
        });
      }
    });
  });
};


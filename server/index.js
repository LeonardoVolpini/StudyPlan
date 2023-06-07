'use strict';

const express = require('express');
const morgan = require('morgan');
const { check, validationResult } = require('express-validator');
const dao = require('./dao');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const userDao = require('./user-dao');
const checker = require('./check');

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, 'Incorrect username and/or password.');
      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Format express-validate errors as strings
  return `${location}[${param}]: ${msg}`;
};

// init express
const app = express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();
  return res.status(401).json({ error: 'Not authorized' });
}

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'choose a secret',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

/*** APIs ***/

// GET /api/courses
app.get('/api/courses', (req, res) => {
  dao.listCourses()
    .then(courses => res.json(courses))
    .catch((err) => {
      res.status(500).json({ error: `Database error while retrieving courses` }).end()
    });
});

// GET /api/courses/<code>/incompatibilita
app.get('/api/courses/:code/incompatibilita',
  [check('code').isLength({ min: 7, max: 7 })],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });  // error message is a single string with all error joined together
    }
    try {
      const result = await dao.getIncompatibilitaByCourse(req.params.code);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).json({ error: `Database error while retrieving incompatibilities of course ${req.params.code}.` }).end();
    }
  });

// POST /api/studyplane/addAll  
app.post('/api/studyplane/addAll', isLoggedIn,
  [check("courses.*.code").isLength({ min: 7, max: 7 }),
  check("courses.*.crediti").isInt()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try { //meglio fare 2 giri? uno se va tutto bene ed al secondo inserisco
      const courses = req.body.courses;
      if (await checker.checkCrediti(courses, req.user.id)) {
        for (const i in courses) {    //primo giro: check possibile aggiunta di tutti i corsi
          if ((await checker.checkCourse(courses[i].code, req.user.id)) === false) {
            if ((await checker.checkAdd(courses[i].code, req.user.id, courses)) === false || (await checker.checkIncompatibilita(courses[i].code, req.user.id)) === false) {
              res.status(409).json({ error: `Error during the add of course ${courses[i].code} for some costraints` });
              return;
            }
          } else {
            res.status(409).json({ error: `Error during the add of course ${courses[i].code} because you already have the course` });
            return;
          }
        }
        for (const i in courses) {  // secondo giro: aggiungo i corsi
          if ((await checker.checkCourse(courses[i].code, req.user.id)) === false) {
            if (await checker.checkAdd(courses[i].code, req.user.id, courses) && await checker.checkIncompatibilita(courses[i].code, req.user.id)) {
              await dao.addCourseStudyPlane(courses[i].code, req.user.id);
            } else {
              res.status(409).json({ error: `Error during the add of course ${courses[i].code} for some costraints` });
              return;
            }
          }
        }
        res.status(200).end();
      }
      else {
        res.status(409).json({ error: `Error during study plane update: maximum credit limit violated` });
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the add of courses: ${err}` });
    }
  });

// DELETE /api/studyplane
app.delete('/api/studyplane', isLoggedIn,   //per cancellare tutto
  [check("courses.*.code").isLength({ min: 7, max: 7 }),
  check("courses.*.crediti").isInt()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      if (await checker.checkExistingStudyPlane(req.user.id)) {
        const courses = req.body.studyPlane;
        for (const i in courses) { //primo giro
          if ((await checker.checkCourse(courses[i].code, req.user.id)) === false) {
            res.status(409).json({ error: `Error during the deletetion of course ${courses[i].code} because you don't have the course` });
            return;
          }
        }
        for (const i in courses) {  //secondo giro
          if (await checker.checkCourse(courses[i].code, req.user.id)) {
            await dao.deleteCourse(courses[i].code, req.user.id);
          } else {
            res.status(409).json({ error: `Error during the deletetion of course ${courses[i].code} because you don't have the course` });
            return;
          }
        }
        await dao.deleteStudyPlane(req.user.id);
        res.status(204).end();
      } else {
        res.status(409).json({ error: `Error during the deletion of the study plane: study plane doesn't exist` });
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of the study plane` });
    }
  });

// DELETE /api/studyplane/<code>
app.delete('/api/studyplane/:code', isLoggedIn,
  [check('code').isLength({ min: 7, max: 7 }),
  check('creditiExtra').isInt()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      if (await checker.checkDelete(req.params.code, req.user.id, req.body.creditiExtra)) {
        await dao.deleteCourse(req.params.code, req.user.id);
        res.status(204).end();
      } else {
        res.status(409).json({ error: `Error during the deletion of course ${req.params.code} for some costraints` });
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of course ${req.params.code}.` });
    }
  });

// GET /api/studyplane
app.get('/api/studyplane', isLoggedIn,
  async (req, res) => {
    try {
      const result = await dao.getStudyPlane(req.user.id);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).json({ error: `Database error while retrieving study plane` }).end()
    }
  }
);

// PUT /api/studyplane/crediti
app.put('/api/studyplane/crediti', isLoggedIn,
  [check('crediti').isInt()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      if (await checker.checkCreditiGeneral(req.body.crediti, req.user.studentId)) {
        await dao.updateCreditiStudyPlane(req.body.crediti, req.user.id);
        res.status(200).end();
      }
      else {
        res.status(409).json({ error: `Error during study plane update: credit limit violated` });
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the update of study plane.` });
    }
  });

// GET api/studyplane/crediti
app.get('/api/studyplane/crediti', isLoggedIn,
  async (req, res) => {
    try {
      const result = await dao.getCreditiStudyPlane(req.user.id);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).json({ error: `Database error while retrieving study plane crediti` }).end()
    }
  }
)

// GET api/studyplane/tipologia
app.get('/api/studyplane/tipologia', isLoggedIn,
  async (req, res) => {
    try {
      const result = await dao.getTipologiaStudyPlane(req.user.id);
      if (result.error)
        res.status(404).json(result);
      else
        res.json(result);
    } catch (err) {
      res.status(500).json({ errors: `Database error while retrieving study plane type` }).end()
    }
  }
);

// POST api/studyplane/tipologia
app.post('/api/studyplane/tipologia', isLoggedIn,
  async (req, res) => {
    try {
      if (checker.checkTipologia(req.body.tipologia) && !(await checker.checkExistingStudyPlane(req.user.id))) {
        await dao.setTipologiaStudyPlane(req.body.tipologia, req.user.id);
        res.status(200).end();
      }
      else {
        res.status(409).json({ error: `Error during the set of type of study plane: type not admissible or already existing a study plane` });
      }
    } catch (err) {
      res.status(503).json({ error: `Database error during the set of type of study plane` });
    }
  });


/*** Users APIs ***/

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.status(200).end(); });
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});

/*** Other express-related instructions ***/

// Activate the server
app.listen(port, () => {
  console.log(`react-score-server listening at http://localhost:${port}`);
});
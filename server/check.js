const dao = require('./dao');

exports.checkTipologia = (tipologia) => {
  if (tipologia === 'part-time' || tipologia === 'full-time')
    return true;
  else
    return false;
}

exports.checkExistingStudyPlane = async (studentId) => {
  try {
    if (await dao.existingStudyPlane(studentId)) {
      return true;
    }
    else
      return false;
  }
  catch {
    return false;
  }
}

async function getStudyPlane(studentId) {
  try {
    const studyPlane = await dao.getStudyPlane(studentId);
    return studyPlane;
  }
  catch {
    return null;
  }
}

async function getCourse(code) {
  try {
    const courses = await dao.listCourses();
    for (const i in courses)
      if (courses[i].code === code)
        return courses[i];
    return null;
  }
  catch {
    return null;
  }
}

exports.checkDelete = async (code, studentId, creditiExtra) => {
  try {
    // non esiste il corso?
    const course = await getCourse(code);
    if (!course)
      return false;
    // ho davvero quel corso?
    if (! await dao.checkExistingCourse(code, studentId))
      return false;
    // delle propedeuticita mi bloccano? 
    const studyPlane = await getStudyPlane(studentId);
    for (const i in studyPlane) {
      const corso = studyPlane[i];
      if (corso.propedeuticita === code) {
        return false;
      }
    }
    // violo il vincolo dei crediti ?
    const cfu = await dao.getCreditiStudyPlane(studentId);
    const crediti = cfu.crediti - course.crediti + creditiExtra;
    const tipo = await dao.getTipologiaStudyPlane(studentId);
    if (tipo.tipologia === 'part-time') {
      if (crediti < 20 || crediti > 40)
        return false;
    }
    else if (tipo.tipologia === 'full-time') {
      if (crediti < 60 || crediti > 80)
        return false;
    }

    return true;
  }
  catch {
    return false;
  }

}

exports.checkAdd = async (code, studentId, courses) => {
  try {
    // non esiste il corso?
    const course = await getCourse(code);
    if (!course)
      return false;
    // delle propedeuticita necessarie mancanti? 
    if (course.propedeuticita) {
      if (! await dao.checkExistingCourse(course.propedeuticita, studentId)) {
        let trov = false;
        for (const i in courses) {    //guardo se ho la propedeuticita tra i corsi che sto aggiungendo
          if (course.propedeuticita === courses[i].code) {
            trov = true;
          }
        }
        if (!trov)
          return false;
      }
    }
    // supero gli studenti massimi?
    if (course.maxStudenti) {
      if (course.iscritti === course.maxStudenti)
        return false;
    }
    return true;
  }
  catch {
    return false;
  }
}

exports.checkCourse = async (code, studentId) => {
  // lo studente ha quel corso?
  if (await dao.checkExistingCourse(code, studentId))
    return true;
  return false;
}

exports.checkIncompatibilita = async (code, studentId) => {
  // check incompatibilita
  const incompatibilita = (await getIncompatibilita(code));
  if (incompatibilita) {
    const studyPlane = await getStudyPlane(studentId);
    for (const j in incompatibilita) {
      const inc = incompatibilita[j];
      for (const k in studyPlane) {
        if (inc === studyPlane[k].code) {
          return false;
        }
      }
    }
  }
  return true;
}

async function getIncompatibilita(code) {
  try {
    const incomp = await dao.getIncompatibilitaByCourse(code);
    return incomp;
  }
  catch {
    return null;
  }
}

exports.checkCrediti = async (courses, studentId) => {
  // errore nei vincoli dei crediti
  const studyPlane = await getStudyPlane(studentId);
  let crediti = calcolaCrediti(courses) + calcolaCrediti(studyPlane);
  const tipo = await dao.getTipologiaStudyPlane(studentId);
  if (tipo.tipologia === 'part-time') {
    if (crediti > 40 || crediti < 20)
      return false;
  }
  else if (tipo.tipologia === 'full-time') {
    if (crediti > 80 || crediti < 60)
      return false;
  }
  return true;
}

function calcolaCrediti(courses) {
  let tot = 0;
  courses.forEach((c) => tot += c.crediti);
  return tot;
}

exports.checkCreditiGeneral = async (crediti, studentId) => {
  const tipo = await dao.getTipologiaStudyPlane(studentId);
  if (tipo.tipologia === 'part-time') {
    if (crediti > 40 || crediti < 20)
      return false;
  }
  else if (tipo.tipologia === 'full-time') {
    if (crediti > 80 || crediti < 60)
      return false;
  }
  return true;
}
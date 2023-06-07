/**
 * All the API calls
 */

const URL = 'http://localhost:3001/api/'

async function getAllCourses() {
  return new Promise((resolve, reject) => {
    fetch(URL + 'courses')
      .then((response) => {
      if (response.ok) {
        response.json()
          .then(json => resolve(json.map((course) => ({
            code: course.code,
            nome: course.nome,
            crediti: course.crediti,
            maxStudenti: course.maxStudenti,
            iscritti: course.iscritti,
            propedeuticita: course.propedeuticita,
            sel: course.sel
          }))))
          .catch( err => reject({ error: "Cannot parse server response" }))
      } else {
        response.json()
          .then((obj) => { reject(obj); }) 
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
};

async function getIncompatibilitaByCourse(code) {
  const response = await fetch(URL + 'courses/' + code + '/incompatibilita');
  const incJson = await response.json();
  if (response.ok) {
    return incJson;
  } else {
    throw incJson;  // mi aspetto che sia un oggetto json fornito dal server che contiene l'errore
  }
};

function addCourses(courses) {
  return new Promise((resolve, reject) => {
    fetch(URL + 'studyplane/addAll', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courses }),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        response.json()
          .then((obj) => { reject(obj); }) 
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

function deleteCourse(course,creditiExtra) {  //creditiExtra per considerare nei vincoli i crediti che andrò ad aggiungere
  return new Promise((resolve, reject) => {
    fetch(URL + 'studyplane/' + course.code, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ creditiExtra: creditiExtra }),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        response.json()
          .then((message) => { reject(message); }) 
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

async function getStudyPlane() {
  const response = await fetch(URL + 'studyplane', { credentials: 'include' });
  const coursesJson = await response.json();
  if (response.ok) {
    return coursesJson.map((course) => ({
      code: course.code,
      nome: course.nome,
      crediti: course.crediti,
      maxStudenti: course.maxStudenti,
      propedeuticita: course.propedeuticita
    }))
  } else {
    throw coursesJson;  // mi aspetto che sia un oggetto json fornito dal server che contiene l'errore
  }
};

function deleteStudyPlane(studyPlane) {
  return new Promise((resolve, reject) => {
    fetch(URL + 'studyplane', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studyPlane }),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        response.json()
          .then((message) => { reject(message); })
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

function updateCreditiStudyPlane(crediti) {
  return new Promise((resolve, reject) => {
    fetch(URL + 'studyplane/crediti', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ crediti: crediti }),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        response.json()
          .then((obj) => { reject(obj); }) 
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

async function getCreditiStudyPlane() {
  const response = await fetch(URL + 'studyplane/crediti', { credentials: 'include' });
  const creditiJson = await response.json();
  if (response.ok) {
    return creditiJson.crediti
  } else {
    throw creditiJson;  // mi aspetto che sia un oggetto json fornito dal server che contiene l'errore
  }
};

async function getTipologiaStudyPlane() {
  const response = await fetch(URL + 'studyplane/tipologia', { credentials: 'include' });
  const tipologiaJson = await response.json();
  if (response.ok) {
    return tipologiaJson.tipologia
  } else {
    throw tipologiaJson;  // mi aspetto che sia un oggetto json fornito dal server che contiene l'errore
  }
};

function setTipologiaStudyPlane(tipologia) {
  return new Promise((resolve, reject) => {
    fetch(URL + 'studyplane/tipologia', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tipologia }),
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        response.json()
          .then((obj) => { reject(obj); })
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}


/*** Users APIs ***/

async function login(credentials) {
  let response = await fetch(URL + 'sessions', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetail = await response.json();
    throw errDetail; 
  }
}

async function logOut() {
  await fetch(URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
}

async function getUserInfo() {
  const response = await fetch(URL + 'sessions/current', { credentials: 'include' });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;  // an object with the error coming from the server
  }
}

const API = {
  getAllCourses, getIncompatibilitaByCourse, addCourses,
  deleteCourse, getStudyPlane, deleteStudyPlane,
  updateCreditiStudyPlane, getCreditiStudyPlane,
  getTipologiaStudyPlane, setTipologiaStudyPlane,
  login, logOut, getUserInfo
};
export default API;
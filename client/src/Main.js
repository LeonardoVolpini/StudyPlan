import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "./API";
import { toast } from "react-toastify";
import RoutesManager from "./Routes";

function Main() {
  const [courses, setCourses] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [studyPlane, setStudyPlane] = useState([]);
  const [cfu, setCfu] = useState(0);
  const [studyPlaneFlag, setStudyPlaneFlag] = useState(studyPlane.length === 0 ? false : true);
  const [savedStudyPlane, setSavedStudyPlane] = useState([]);                                           //piano di studi gia presente nel db
  const [initialLoading, setInitialLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        setInitialLoading(true);
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) {
        handleError(err);
        setUser(null);
        setLoggedIn(false);
        navigate('/home');
      }
    };
    if (loggedIn)
      init();
    API.getAllCourses()
      .then((courses) => {
        setCourses(courses);
        courses.forEach((c) => {
          getIncompatibilita(c);
        });
        setInitialLoading(false);
      })
      .catch(err => {
        handleError(err)
      })
  }, []); // eslint-disable-line

  useEffect(() => {
    if (loggedIn) {
      setInitialLoading(true);
      API.getStudyPlane()
        .then((corsi) => {
          if (corsi.length !== 0) {
            setStudyPlane(corsi);
            setSavedStudyPlane(corsi);
            setStudyPlaneFlag(true);
            corsi.forEach((c) => {
              getIncompatibilita(c);
              courses.forEach((corso) => {
                if (corso.incompatibilita) {
                  for (const k in corso.incompatibilita) {
                    if (corso.incompatibilita[k] === c.code) {
                      corso.inc = true;
                    }
                  }
                }
                if (corso.code === c.code) {
                  corso.sel = true;
                  c.iscritti = corso.iscritti;
                }

              });
            });
            API.getCreditiStudyPlane()
              .then((crediti) => {
                setCfu(crediti);
              })
              .catch(err => {
                handleError(err);
              })
          }
          courses.forEach((c) => {
            if (c.propedeuticita) {
              let trov = false;
              for (const i in corsi) {
                if (corsi[i].code === c.propedeuticita) {
                  c.prop = false;
                  trov = true;
                }
              }
              if (!trov)
                c.prop = true;
            }
          });
          setInitialLoading(false);
        })
        .catch(err => handleError(err))
    }
  }, [loggedIn])  // eslint-disable-line

  function handleError(err) {
    toast.error(
      err.error,
      { position: "top-center" },
      { toastId: 12 }
    );
  }

  function getIncompatibilita(course) {
    API.getIncompatibilitaByCourse(course.code)
      .then((incomp) => {
        if (Array.isArray(incomp))
          course.incompatibilita = incomp;
      })
      .catch((err) => {
        handleError(err);
      });
  }

  function deleteCourseClient(course) {
    for (const i in studyPlane) {
      if (studyPlane[i].propedeuticita === course.code) {
        handleError({ error: `Cannot delete course: it is propaedeutic for course: ${studyPlane[i].nome}` });
        return;
      }
    }
    courses.forEach((c) => {
      if (course.code === c.code) {
        c.sel = false;
        c.iscritti -= 1;
      }
      if (c.propedeuticita === course.code && c.prop === false) {
        c.prop = true;
      }
      if (c.incompatibilita)
        for (const i in c.incompatibilita) {
          const inc = c.incompatibilita[i];
          if (inc === course.code && c.inc)
            c.inc = false;
        }
    });
    setStudyPlane(studyPlane.filter((c) => c.code !== course.code));
    setCfu(crediti => crediti - course.crediti);
    toast.success(
      "Course deleted",
      { position: "top-center" },
      { toastId: 3 }
    );
  }

  function checkCourseInArray(code, lista) {
    for (const i in lista) {
      const e = lista[i];
      if (code === e.code) {
        return e;
      }
    }
    return null;
  }

  function addCourseClient(course) {
    if (course.prop) {
      handleError({ error: `Add the propaedeutic course ${course.propedeuticita} before` });
    } else if (course.inc) {
      handleError({ error: "This course has incompatibilities with one or more already selected courses" });
    } else if (course.sel) {
      handleError({ error: "Course already selected" });
    } else if (course.maxStudenti && course.iscritti === course.maxStudenti) {
      handleError({ error: "The course has already reached the maximum number of participants" });
    }
    else {
      courses.forEach((c) => {
        if (c.code === course.code) {
          c.sel = true;
          c.iscritti += 1;
        }
        if (c.propedeuticita === course.code && c.prop) {
          c.prop = false;
        }
        if (c.incompatibilita)
          for (const i in c.incompatibilita) {
            const inc = c.incompatibilita[i];
            if (inc === course.code && !c.inc)
              c.inc = true;
          }
      });
      setStudyPlane(oldcourses => [...oldcourses, course]);
      setCfu(crediti => crediti + course.crediti);
      toast.success(
        "Course added",
        { position: "top-center" },
        { toastId: 3 }
      );
    }
  }

  function resetStatusCourses(courses, studyPlane) {
    courses.forEach((c) => {
      c.sel = false;
      c.inc = false;
      if (c.propedeuticita) {
        c.prop = true;
      }
      else
        c.prop = false;
    });
    if (studyPlane.length !== 0) {
      studyPlane.forEach((c) => {
        for (const i in courses) {
          const corso = courses[i];
          if (corso.code === c.code)
            corso.sel = true;
          if (c.incompatibilita) {
            for (const k in c.incompatibilita) {
              if (c.incompatibilita[k] === corso.code)
                corso.inc = true;
            }
          }
          if (corso.propedeuticita === c.code)
            corso.prop = false;
        }
      });
    }
  }

  async function deleteStudyPlane() {
    try {
      await API.deleteStudyPlane(savedStudyPlane);
      setStudyPlane([]);
      setSavedStudyPlane([]);
      setCfu(0);
      setStudyPlaneFlag(false);
      resetStatusCourses(courses, []);
      toast.success(
        "Study plane deleted",
        { position: "top-center" },
        { toastId: 3 }
      );
    }
    catch (err) {
      handleError(err);
    }
  }

  function calcolaDifferenze() {
    let add = [];
    let del = [];
    for (const i in studyPlane) {
      let trovato = false;
      const corso1 = studyPlane[i];
      for (const j in savedStudyPlane) {
        const corso2 = savedStudyPlane[j];
        if (corso1.code === corso2.code) {
          trovato = true;
          break;
        }
      }
      if (!trovato) {
        courses.forEach((c) => {
          if (c.code === corso1.code)
            add.push(c);
        })
      }
    }
    for (const i in savedStudyPlane) {
      let trovato = false;
      const corso1 = savedStudyPlane[i];
      for (const j in studyPlane) {
        const corso2 = studyPlane[j];
        if (corso1.code === corso2.code) {
          trovato = true;
          break;
        }
      }
      if (!trovato) {
        courses.forEach((c) => {
          if (c.code === corso1.code)
            del.push(c);
        })
      }
    }
    return {
      add: add,
      del: del
    }
  }

  function saveStudyPlane() {
    const diff = calcolaDifferenze();
    if (diff.del.length === 0 && diff.add.length === 0) {
      toast.info(
        "No change in the study plane",
        { position: "top-center" },
        { toastId: 3 }
      );
      return;
    }
    if (diff.del.length !== 0) {
      for (const i in diff.del) {
        API.deleteCourse(diff.del[i], calcolaCrediti(diff.add))
          .then(async () => {
            try {
              await API.updateCreditiStudyPlane(cfu);
              setSavedStudyPlane(studyPlane);
              if (diff.add.length === 0) {
                toast.success(
                  "Study plane successfully saved",
                  { position: "top-center" },
                  { toastId: 3 }
                );
              }
            }
            catch (err) {
              handleError(err);
            }
          })
          .catch((err) =>
            handleError(err)
          );
      }
    }
    if (diff.add.length !== 0) {
      if (checkSave(diff.add)) {
        API.addCourses(diff.add)
          .then(async () => {
            try {
              await API.updateCreditiStudyPlane(cfu);
              setSavedStudyPlane(studyPlane);
              toast.success(
                "Study plane successfully saved",
                { position: "top-center" },
                { toastId: 3 }
              );
            }
            catch (err) {
              handleError(err);
            }
          })
          .catch((err) => {
            handleError(err);
            if (diff.del.length !== 0)
              API.addCourses(diff.del)
                .then(() => { })
                .catch((err) =>
                  handleError(err)
                );
          });
      } else {
        handleError({ error: "Unable to save the study plane" });
      }
    }
  }

  function calcolaCrediti(courses) {
    let tot = 0;
    courses.forEach((c) => tot += c.crediti);
    return tot;
  }

  function checkSave(lista) {
    for (const c in lista) {
      const corso = lista[c];
      if (!checkAddCourse(corso)) {
        return false;
      }
    }
    return true;
  }

  function checkAddCourse(course) {
    if (course.propedeuticita) {
      if (checkCourseInArray(course.propedeuticita, studyPlane) === null) {
        handleError({ error: `Manca il corso propedeutico per il corso: ${course.nome}` });
        return false;
      }

    }
    if (course.maxStudenti) {
      if (course.iscritti > course.maxStudenti) {
        handleError({ error: `Il corso ${course.nome} ha superato il numero massimo di iscritti` });
        return false;
      }
    }
    if (course.incompatibilita) {
      for (const i in course.incompatibilita) {
        if (checkCourseInArray(course.incompatibilita[i], studyPlane) !== null) {
          handleError({ error: `Il corso ${course.nome} ha un corso incompatibile nel piano di studi` });
          return false;
        }
      }
    }
    return true;
  }

  const doLogin = async (credentials) => {
    try {
      const user = await API.login(credentials);
      toast.success(
        `Welcome ${user.name}!`,
        { position: "top-center" },
        { toastId: 1 }
      );
      setLoggedIn(true);
      setUser(user);
      navigate('/');
    } catch (err) {
      handleError(err);
    }
  }

  const doLogout = () => {
    if (savedStudyPlane.length === 0 && studyPlaneFlag)
      deleteStudyPlane();
    API.logOut()
      .then(() => {
        setInitialLoading(true);
        toast.success(
          "Logout Succeeded",
          { position: "top-center" },
          { toastId: 2 }
        )
        //resettare lo stato dell'applicazione
        API.getAllCourses()         //resetto anche gli iscritti
          .then((courses) => {
            setCourses(courses);
            courses.forEach((c) => {
              getIncompatibilita(c);
            });
            setInitialLoading(false);
          })
          .catch(err => handleError(err));
        setStudyPlaneFlag(false);
        setLoggedIn(false);
        setUser({});
        setStudyPlane([]);
        setSavedStudyPlane([]);
        setCfu(0);
        navigate('/');
      })
      .catch(() =>
        handleError({ error: "Error during logout, try again" })
      );
  }

  return (
    <RoutesManager
      user={user}
      doLogin={doLogin}
      doLogout={doLogout}
      loggedIn={loggedIn}
      initialLoading={initialLoading}
      courses={courses}
      studyPlane={studyPlane}
      setStudyPlane={setStudyPlane}
      savedStudyPlane={savedStudyPlane}
      studyPlaneFlag={studyPlaneFlag}
      setStudyPlaneFlag={setStudyPlaneFlag}
      cfu={cfu}
      setCfu={setCfu}
      addCourse={addCourseClient}
      deleteCourseClient={deleteCourseClient}
      saveStudyPlane={saveStudyPlane}
      deleteStudyPlane={deleteStudyPlane}
      checkCourseInArray={checkCourseInArray}
      resetStatusCourses={resetStatusCourses}
    />
  );
}

export default Main;
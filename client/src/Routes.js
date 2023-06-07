import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row } from "react-bootstrap";
import { NavigationBar } from "./components/Navbar";
import { Route, Routes, Navigate } from "react-router-dom";
import { LoginForm, LoginButton, LogoutButton } from "./components/LoginComponents";
import { StudyPlane, Salva, Cancella, Annulla } from "./components/StudyPlaneComponents";
import { CreateStudyPlane } from "./components/CreateStudyPlaneComponents"
import Loading from "./components/Loading";
import { ToastContainer, toast } from "react-toastify";
import { CourseLibrary } from "./components/CourseComponents";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import API from "./API";

const RoutesManager = ({
  user,
  doLogin,
  doLogout,
  loggedIn,
  initialLoading,
  courses,
  studyPlane,
  setStudyPlane,
  savedStudyPlane,
  studyPlaneFlag,
  setStudyPlaneFlag,
  cfu,
  setCfu,
  addCourse,
  deleteCourseClient,
  saveStudyPlane,
  deleteStudyPlane,
  checkCourseInArray,
  resetStatusCourses,
}) => {
  const [tipologia, setTipologia] = useState('');


  async function createTipologia(tipologia) {
    try {
      await API.setTipologiaStudyPlane(tipologia);
      setTipologia(tipologia);
      setStudyPlaneFlag(true);
    }
    catch (err) {
      toast.error(
        err.error,
        { position: "top-center" },
        { toastId: 12 }
      );
    }
  }

  useEffect(() => {
    if (loggedIn && studyPlaneFlag) {
      API.getTipologiaStudyPlane()
        .then((type) => setTipologia(type))
        .catch((err) => {
          toast.error(
            err.error,
            { position: "top-center" },
            { toastId: 12 }
          );
        });
    }
  }, [loggedIn, studyPlaneFlag])

  return (
    <div className="container-fluid">
      <ToastContainer />
      {loggedIn ? (
        <Row>
          <NavigationBar
            user={user} loggedIn={loggedIn} />
        </Row>
      ) : (
        false   //non mostro la barra quando ad utente non loggato 
      )}
      <Row>
        <Routes>
          <Route
            path="/"
            element={
              initialLoading ? <Loading />
                : loggedIn ?
                  <Navigate to="/home/logged" />
                  : <Navigate to="/home" />
            }>
          </Route>
          <Route
            path="/login"
            element={<LoginForm login={doLogin} />}
          />
          <Route
            path="/home/logged"
            element={
              <>
                <CourseLibrary loggedIn={loggedIn} courses={courses} studyPlaneFlag={studyPlaneFlag} addCourse={addCourse} />
                {studyPlaneFlag ?
                  <>
                    <StudyPlane
                      courses={studyPlane}
                      deleteCourse={deleteCourseClient}
                      cfu={cfu}
                      tipologia={tipologia}
                    />
                    <Salva saveStudyPlane={saveStudyPlane} cfu={cfu} tipologia={tipologia} />
                    <Annulla
                      studyPlane={studyPlane}
                      courses={courses}
                      setStudyPlane={setStudyPlane}
                      savedStudyPlane={savedStudyPlane}
                      setCfu={setCfu}
                      checkCourseInArray={checkCourseInArray}
                      resetStatusCourses={resetStatusCourses}
                    />
                    <Cancella deleteStudyPlane={deleteStudyPlane} />
                  </>
                  :
                  <CreateStudyPlane createTipologia={createTipologia} />
                }
                <LogoutButton logout={doLogout} user={user} />
              </>
            }
          />
          <Route
            path="/home"
            element={
              <>
                <CourseLibrary courses={courses} loggedIn={loggedIn} studyPlaneFlag={studyPlaneFlag} />
                <LoginButton />
              </>
            }
          />
          <Route
            path="/*"
            element={<Navigate to="/home" />} />
        </Routes>
      </Row>
    </div>
  );
};

export default RoutesManager;

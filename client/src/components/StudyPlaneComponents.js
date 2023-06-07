import { Table, Col, Button, Collapse } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState } from "react";
import { Trash3 } from "react-bootstrap-icons";
import { Link } from 'react-router-dom';
import { toast } from "react-toastify";

function StudyPlane(props) {
  return (
    <>
      <Table>
        <thead>
          <tr>
            <th
              colSpan="4"
              scope="colgroup"
              style={{ fontSize: 35, width: "100%" }}
            >
              Study Plane
            </th>
          </tr>
        </thead>
        <tbody>
          {
            props.courses.length ?
              props.courses.map((c) => (
                <CourseRow
                  course={c}
                  key={c.code}
                  deleteCourse={props.deleteCourse}
                />
              )) :
              <tr><td>Al momento non sono presenti corsi nel piano di studi. Aggiungine alcuni dalla lista dei corsi</td></tr>
          }
        </tbody>
      </Table>
      <div>Numero di crediti correnti: {props.cfu}</div>
      <div>Minimo crediti: {props.tipologia === 'part-time' ? 20 : 60}</div>
      <div>Max crediti: {props.tipologia === 'part-time' ? 40 : 80}</div>
    </>
  );
}

function CourseRow(props) {
  return (
    <>
      <tr>
        <CourseActions course={props.course} deleteCourse={props.deleteCourse} />
        <CourseData course={props.course} />
      </tr>
    </>
  );
}

function CourseData(props) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <>
      <td className={"col-2"}>
        {props.course.code}
      </td>
      <td className={"col-5"}>
        {props.course.nome}
      </td>
      <td className="col-1">
        {props.course.crediti}
      </td>
      <td className={"col-1"}>
        {props.course.iscritti}
      </td>
      <td className="col-1">
        {props.course.maxStudenti ? props.course.maxStudenti : ""}
      </td>
      <td className="col-1">
        <Button variant="info" onClick={() => setShowInfo(!showInfo)}>Info</Button>
        <Collapse in={showInfo}>
          <div>
            <Table>
              <thead>
                <tr>
                  <th>Incompatibilita</th>
                  <th>Propedeuticita</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  < td className="col-8" >
                    {props.course.incompatibilita ?
                      (props.course.incompatibilita.join('\n')) :
                      "nessuna incompatibilità"}
                  </td >
                  <td className="col-4">
                    {props.course.propedeuticita ? props.course.propedeuticita : "nessuna propedeuticità"}
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Collapse>
      </td>
    </>
  );
}

function CourseActions(props) {
  return (
    <td className="col-2">
      <DeleteIcon onDelete={() => props.deleteCourse(props.course)} />
    </td>
  );
}

const OPACITY_WHEN_MOUSE_INTERACT = 0.6;
const NORMAL_OPACITY = 0.85;

const DeleteIcon = (props) => {
  const [opacity, setOpacity] = useState(NORMAL_OPACITY);
  return (
    <Trash3
      fontSize={17}
      style={{ marginBottom: 2 }}
      onClick={props.onDelete}
      opacity={opacity}
      onMouseOver={() => setOpacity(OPACITY_WHEN_MOUSE_INTERACT)}
      onMouseLeave={() => setOpacity(NORMAL_OPACITY)}
      onMouseDown={() => setOpacity(1)}
      onMouseUp={() => setOpacity(OPACITY_WHEN_MOUSE_INTERACT)}
    />
  );
};

function Salva(props) {
  return (
    <Col>
      <Link to="/home/logged">
        <Button variant="primary"
          onClick={() => {
            if (possibleSave(props.tipologia, props.cfu)) {
              props.saveStudyPlane();
            }
          }
          }>
          Salva
        </Button>
      </Link>
    </Col>
  );
}

function possibleSave(tipologia, crediti) {
  let check = true;
  //check crediti corretti
  switch (tipologia) {
    case 'part-time':
      if (crediti < 20 || crediti > 40) {
        check = false;
        toast.error(
          "Unable to save study plan, credits must be between 20 and 40",
          { position: "top-center" },
          { toastId: 12 }
        );
      } else
        check = true;
      break;
    case 'full-time':
      if (crediti < 60 || crediti > 80) {
        check = false;
        toast.error(
          "Unable to save study plan, credits must be between 60 and 80",
          { position: "top-center" },
          { toastId: 12 }
        );
      } else
        check = true;
      break;
    default:
      check = false;
      toast.error(
        "Unable to save study plan, type must be part-time or full-time",
        { position: "top-center" },
        { toastId: 12 }
      );
      break;
  }
  return check;
}

function Cancella(props) {
  return (
    <Col>
      <Link to="/home/logged">
        <Button variant="danger"
          onClick={() => {
            props.deleteStudyPlane();
          }}>
          Cancella
        </Button>
      </Link>
    </Col>
  )
}

function Annulla(props) {

  function resetIscritti(corsi, mod) {
    if (mod === 'add') {               //quelli che sono stati aggiunti rispetto al savedStudyPlane
      corsi.forEach((c) => {
        c.iscritti += 1
      });
    }
    else if (mod === 'delete') {       //quelli che sono stati elimanti rispetto al savedStudyPlane
      corsi.forEach((c) => {
        c.iscritti -= 1
      });
    }
  }

  return (
    <Col>
      <Link to="/home/logged">
        <Button variant="danger"
          onClick={() => {
            resetIscritti(coursesToDelete(props.savedStudyPlane, props.studyPlane, props.courses), 'delete');
            resetIscritti(coursesToAdd(props.savedStudyPlane, props.studyPlane, props.courses), 'add');
            props.setStudyPlane(props.savedStudyPlane);
            props.setCfu(calcolaCrediti(props.savedStudyPlane));
            props.resetStatusCourses(props.courses, props.savedStudyPlane);
          }}>
          Annulla
        </Button>
      </Link>
    </Col>
  )
}

function calcolaCrediti(courses) {
  let tot = 0;
  courses.forEach((c) => tot += c.crediti);
  return tot;
}

function coursesToDelete(oldStudyPlane, newStudyPlane, courses) {
  let result = [];
  for (const i in newStudyPlane) {
    let trovato = false;
    const corso1 = newStudyPlane[i];
    for (const j in oldStudyPlane) {
      const corso2 = oldStudyPlane[j];
      if (corso1.code === corso2.code) {
        trovato = true;
        break;
      }
    }
    if (!trovato) {
      courses.forEach((c) => {
        if (c.code === corso1.code)
          result.push(c);
      })
    }
  }
  return result;
}

function coursesToAdd(oldStudyPlane, newStudyPlane, courses) {
  let result = [];
  for (const i in oldStudyPlane) {
    let trovato = false;
    const corso1 = oldStudyPlane[i];
    for (const j in newStudyPlane) {
      const corso2 = newStudyPlane[j];
      if (corso1.code === corso2.code) {
        trovato = true;
        break;
      }
    }
    if (!trovato) {
      courses.forEach((c) => {
        if (c.code === corso1.code)
          result.push(c);
      })
    }
  }
  return result;
}

export { StudyPlane, Salva, Cancella, Annulla };

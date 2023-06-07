import { Table, Button, Collapse } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useEffect, useState } from "react";
import { PlusCircleFill } from "react-bootstrap-icons";

function CourseLibrary(props) {

  useEffect(() => {
    if (!props.loggedIn) {
      props.courses.forEach((c) => {
        c.sel = false;
        c.prop = false;
        c.inc = false;
      });
    }
  }, [props.loggedIn]) // eslint-disable-line

  return (
    <>
      <div style={{ fontSize: 45, width: "100%" }}>All Courses</div>
      <Table>
        <thead>
          <tr>
            {props.loggedIn && props.studyPlaneFlag ? <th>Aggiungi</th> : ''}
            <th>Codice</th>
            <th>Nome</th>
            <th>Crediti</th>
            <th>Iscritti</th>
            <th>Max Studenti</th>
          </tr>
        </thead>
        <tbody>
          {
            props.courses.map((c) =>
            (
              <CourseRow
                course={c}
                key={c.code}
                addCourse={props.addCourse ? props.addCourse : null}
                loggedIn={props.loggedIn}
                studyPlane={props.studyPlaneFlag}
              />
            ))
          }
        </tbody>
      </Table> </>
  );
}

function CourseRow(props) {
  let statusClass = null;

  if (props.loggedIn) {
    if (props.course.prop) {           //impossibile aggiungere, manca il corso propedeutico
      statusClass = 'table-danger';
    }
    else if (props.course.inc) {      //impossibile aggiungere, c'è una incompatibilità nel corso di studi
      statusClass = 'table-warning';
    }
    else if (props.course.sel) {      //impossibile aggiundere, corso già selezionato
      statusClass = 'table-secondary';
    }
    else if (props.course.maxStudenti) {
      if (props.course.iscritti === props.course.maxStudenti)   //impossibile aggiundere, corso ha gi' raggiunto il numero max di iscritti
        statusClass = 'table-info'
    }
  }

  return (
    <>
      <tr className={statusClass}>
        <CourseActions course={props.course} addCourse={props.addCourse} loggedIn={props.loggedIn} studyPlane={props.studyPlane} />
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
      <td className={"col-6"}>
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
    props.loggedIn && props.studyPlane ?
      <td className="col-2">
        <AddIcon onAdd={() => props.addCourse(props.course)} />
      </td>
      :
      ''
  );
}

const OPACITY_WHEN_MOUSE_INTERACT = 0.6;
const NORMAL_OPACITY = 0.85;

const AddIcon = (props) => {
  const [opacity, setOpacity] = useState(NORMAL_OPACITY);
  return (
    <PlusCircleFill
      fontSize={18}
      style={{ marginRight: 5 }}
      onClick={props.onAdd}
      opacity={opacity}
      onMouseOver={() => setOpacity(OPACITY_WHEN_MOUSE_INTERACT)}
      onMouseLeave={() => setOpacity(NORMAL_OPACITY)}
      onMouseDown={() => setOpacity(1)}
      onMouseUp={() => setOpacity(OPACITY_WHEN_MOUSE_INTERACT)}
    />
  );
};

export { CourseLibrary };

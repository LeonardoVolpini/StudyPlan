import { Form, Col, Button, Alert } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'

function CreateStudyPlane(props) {
  const [partTime, setPartTime] = useState(false);
  const [fullTime, setFullTime] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!partTime && !fullTime) {
      setErrorMessage("Errore: selezionare una tipoligia di piano di studi");
      return;
    }
    else if (partTime) {
      props.createTipologia("part-time")
        .catch((err) => { setErrorMessage(err); });
    }

    else if (fullTime) {
      props.createTipologia("full-time")
        .catch((err) => { setErrorMessage(err); });
    }
    navigate('/home/logged');
  };

  const changeToFullTime = (val) => {
    setFullTime(val);
    setPartTime(!val);
  }

  const changeToPartTime = (val) => {
    setPartTime(val);
    setFullTime(!val);
  }

  return (
    <div className="Login Study main-content text-center">
      <h2>Create Study Plane</h2><br />
      {errorMessage ? (
        <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
          {errorMessage}
        </Alert>
      ) : (
        false
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group >
          <Form.Check
            type="radio"
            id="part-time"
            label="Part-time"
            checked={partTime}
            onChange={(ev) => changeToPartTime(ev.target.checked)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Check
            type="radio"
            id="full-time"
            label="Full-time"
            checked={fullTime}
            onChange={(ev) => changeToFullTime(ev.target.checked)}
          />
        </Form.Group>
        <Button type='submit'>Save</Button>
      </Form>
    </div>
  );
}

export { CreateStudyPlane };

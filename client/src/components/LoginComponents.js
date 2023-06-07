import React, { useState } from "react";
import { Form, Button, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import './Login.css'

function LoginForm(props) {
  const [username, setUsername] = useState('u2@p.it');
  const [password, setPassword] = useState('password');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');
    const credentials = { username, password };

    if (username.trim() === '') {
      setErrorMessage('Email cannot be empty.');
      return;
    }
    if (password === '') {                              //password può essere di soli spazi
      setErrorMessage('Password cannot be empty.');
      return;
    }
    props.login(credentials);
  };


  return (
    <div className="Login main-content text-center">
      <h2>LOGIN</h2><br />
      {errorMessage ? (
        <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
          {errorMessage}
        </Alert>
      ) : (
        false
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId='username'>
          <Form.Label>Email</Form.Label>
          <Form.Control type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
        </Form.Group>
        <br />
        <Form.Group controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
        </Form.Group>
        <br />

        <Form.Group size="lg">
          <Button size="lg" id="submitLogin" type="submit">
            Login
          </Button>
        </Form.Group>
        <Form.Group size="lg">
          <Button size="lg" onClick={() => navigate('/home')}>
            Cancel
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
}

function LoginButton() {
  return (
    <Col className="text-center">
      <Link to="/login">
        <Button variant="primary">Login</Button>
      </Link>
    </Col>
  );
}

function LogoutButton(props) {
  return (
    <Col className="text-center">
      <span>User: {props.user?.name}</span>{' '}<Button variant="warning" onClick={props.logout}>Logout</Button>
    </Col>
  )
}

export { LoginForm, LoginButton, LogoutButton }

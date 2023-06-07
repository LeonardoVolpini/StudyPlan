import { Navbar, Form, FormControl } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import { PersonCircle, Book } from "react-bootstrap-icons";
function NavigationBar(props) {
  const [value, setValue] = useState('');

  const onSubmitForm = (e) => {
    e.preventDefault();
  };

  return (
    <Navbar className="d-flex flex-row justify-content-between " bg="primary">
      <div style={{ flex: 0.2 }} className='d-flex flex-row'><Book fill="white" fontSize={20} style={{ marginTop: "2%" }} />
        <div style={{ paddingLeft: "3%", fontWeight: '500', fontSize: 20, color: 'White' }}>Carrer Service</div></div>
      <Form style={{ marginRight: '7%' }} onSubmit={onSubmitForm}>
        <FormControl
          onChange={(e) => setValue(e.target.value)}
          value={value}
          type="text"
          placeholder="Search"
          className="md"
        />
      </Form>
      <div style={{ paddingLeft: "3%", fontWeight: '500', fontSize: 20, color: 'White' }}>
        {props.loggedIn ? props.user.name : false}
        <PersonCircle className="m-2" fill="white" fontSize={20} />
      </div>
    </Navbar>
  );
}

export { NavigationBar };
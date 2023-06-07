import { Row, Col } from 'react-bootstrap';

function Loading() {
    return (
      <Row className="vh-100">
        <Col md={4} bg="light">  
        </Col>
        <Col md={8}>
          <h1>Courses List ...</h1>
        </Col>
      </Row>
    )
  }

export default Loading
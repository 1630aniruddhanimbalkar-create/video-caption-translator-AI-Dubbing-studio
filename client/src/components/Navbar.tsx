import React from 'react';
import { Navbar, Container, Nav, Badge, Button } from 'react-bootstrap';

interface NavbarProps {
  dbConnected: boolean;
  projectCount: number;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onNewProject: () => void;
}

export const AppNavbar: React.FC<NavbarProps> = ({
  dbConnected,
  projectCount,
  onOpenHistory,
  onOpenSettings,
  onNewProject
}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="border-bottom border-secondary shadow-sm py-2">
      <Container fluid className="px-3 px-md-4">
        <Navbar.Brand href="#home" className="d-flex align-items-center gap-2 fw-bold fs-5 text-white">
          <div className="brand-logo-icon bg-primary text-white rounded d-flex align-items-center justify-content-center">
            <i className="bi bi-camera-reels-fill fs-5"></i>
          </div>
          <span className="brand-text">
            Video Caption <span className="text-primary">Translator</span>
          </span>
          <Badge bg="info" className="text-dark ms-2 fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}>
            MERN STACK
          </Badge>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center gap-2 mt-2 mt-lg-0">
            {/* MongoDB Status Indicator */}
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded bg-secondary bg-opacity-25 border border-secondary border-opacity-50 text-light me-lg-2">
              <span
                className={`db-indicator-dot rounded-circle ${dbConnected ? 'bg-success' : 'bg-warning'}`}
                style={{ width: '8px', height: '8px', display: 'inline-block' }}
              ></span>
              <span style={{ fontSize: '0.8rem' }} className="fw-medium">
                MongoDB: {dbConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>

            {/* History Button */}
            <Button
              variant="outline-light"
              size="sm"
              onClick={onOpenHistory}
              className="d-flex align-items-center gap-2 px-3"
            >
              <i className="bi bi-clock-history"></i>
              <span>Saved Projects</span>
              <Badge bg="primary" pill>
                {projectCount}
              </Badge>
            </Button>

            {/* AI Tools Info Button */}
            <Button
              variant="outline-info"
              size="sm"
              onClick={onOpenSettings}
              className="d-flex align-items-center gap-2 px-3"
            >
              <i className="bi bi-cpu-fill"></i>
              <span>AI Tools</span>
            </Button>

            {/* New Project Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={onNewProject}
              className="d-flex align-items-center gap-2 px-3 fw-semibold shadow-sm"
            >
              <i className="bi bi-plus-circle-fill"></i>
              <span>New Video</span>
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

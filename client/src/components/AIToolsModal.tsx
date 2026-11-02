import React from 'react';
import { Modal, Button, Card, Badge, ListGroup } from 'react-bootstrap';

interface AIToolsModalProps {
  show: boolean;
  onHide: () => void;
}

export const AIToolsModal: React.FC<AIToolsModalProps> = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered contentClassName="bg-dark text-white border-secondary">
      <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-50">
        <Modal.Title className="fs-5 d-flex align-items-center gap-2">
          <i className="bi bi-cpu-fill text-info"></i>
          <span>AI Engines & Pipeline Architecture</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-3">
        <p className="text-light text-opacity-75">
          This full MERN Stack application converts the original Python Tkinter desktop pipeline into modern high-performance JavaScript/TypeScript algorithms.
        </p>

        <div className="d-flex flex-column gap-3">
          {/* Card 1: Speech-to-Text */}
          <Card className="bg-black border-secondary border-opacity-50 text-white">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-mic-fill text-primary fs-5"></i>
                  <span className="fw-semibold">1. Speech-to-Text Recognition</span>
                </div>
                <Badge bg="primary">Free Google Speech API</Badge>
              </div>
              <p className="small text-muted mb-2">
                Exact JavaScript port of Python's <code>speech_recognition.Recognizer.recognize_google</code>. Audio is chunked with 2-second overlap, converted to 16kHz mono FLAC streams, and recognized with adaptive dynamic thresholds and retries.
              </p>
              <ListGroup variant="flush" className="small">
                <ListGroup.Item className="bg-transparent text-light border-secondary border-opacity-25 py-1 px-0">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Automatic chunking (5-second intervals with 2-second boundary smoothing)
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent text-light border-secondary border-opacity-25 py-1 px-0">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                  Triple-retry resilience mechanism for failed network packets
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Card 2: Neural Translation */}
          <Card className="bg-black border-secondary border-opacity-50 text-white">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-translate text-warning fs-5"></i>
                  <span className="fw-semibold">2. Neural Translation Engine</span>
                </div>
                <Badge bg="warning" className="text-dark">Google Translate API</Badge>
              </div>
              <p className="small text-muted mb-2">
                Port of Python's <code>googletrans.Translator</code>. Translates full transcripts as well as discrete subtitle segments with millisecond timing precision across 100+ languages.
              </p>
            </Card.Body>
          </Card>

          {/* Card 3: AI Text-To-Speech & Video Dubbing */}
          <Card className="bg-black border-secondary border-opacity-50 text-white">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-soundwave text-info fs-5"></i>
                  <span className="fw-semibold">3. AI Voice Generation & Video Dubbing</span>
                </div>
                <Badge bg="info" className="text-dark">Neural TTS & Muxing</Badge>
              </div>
              <p className="small text-muted mb-2">
                Synthesizes fluent voice audio files (.mp3) from the translated captions in any chosen language. Also allows one-click muxing to generate a dubbed video (.mp4) replacing original speech with the AI synthesized voice track.
              </p>
            </Card.Body>
          </Card>

          {/* Card 3: Storage & Database */}
          <Card className="bg-black border-secondary border-opacity-50 text-white">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-database-fill text-success fs-5"></i>
                  <span className="fw-semibold">3. MongoDB Persistent Database</span>
                </div>
                <Badge bg="success">Mongoose ODM</Badge>
              </div>
              <p className="small text-muted mb-0">
                Saves projects, video metadata, segment timestamps, translations, and export history to local MongoDB (<code>mongodb://127.0.0.1:27017</code>).
              </p>
            </Card.Body>
          </Card>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-secondary border-opacity-50">
        <Button variant="secondary" size="sm" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

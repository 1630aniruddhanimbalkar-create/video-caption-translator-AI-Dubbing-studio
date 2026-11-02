import React from 'react';
import { Modal, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { VideoProject } from '../types';

interface ProjectHistoryModalProps {
  show: boolean;
  onHide: () => void;
  projects: VideoProject[];
  loading: boolean;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  show,
  onHide,
  projects,
  loading,
  onSelectProject,
  onDeleteProject
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered contentClassName="bg-dark text-white border-secondary">
      <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-50">
        <Modal.Title className="fs-5 d-flex align-items-center gap-2">
          <i className="bi bi-database-fill-check text-primary"></i>
          <span>MongoDB Saved Projects History</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-muted">Loading projects from MongoDB...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-inbox display-4 mb-2 d-block"></i>
            <p>No video transcription projects saved in MongoDB yet.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <Table hover responsive variant="dark" className="mb-0 align-middle">
              <thead className="table-dark text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <tr>
                  <th>Title / Video</th>
                  <th>Duration</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj._id}>
                    <td>
                      <div className="fw-semibold text-truncate" style={{ maxWidth: '220px' }}>
                        {proj.title || proj.originalFileName}
                      </div>
                      <small className="text-muted d-block text-truncate" style={{ maxWidth: '220px' }}>
                        {proj.originalFileName}
                      </small>
                    </td>
                    <td>{formatDuration(proj.duration)}</td>
                    <td>
                      <Badge bg="secondary" className="font-monospace">
                        {proj.targetLanguage?.toUpperCase() || 'ES'}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        bg={
                          proj.status === 'completed'
                            ? 'success'
                            : proj.status === 'failed'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {proj.status}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : 'N/A'}
                      </small>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            onSelectProject(proj._id);
                            onHide();
                          }}
                          title="Open project in editor"
                        >
                          <i className="bi bi-box-arrow-in-right"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteProject(proj._id)}
                          title="Delete project from MongoDB"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-secondary border-opacity-50">
        <Button variant="secondary" size="sm" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

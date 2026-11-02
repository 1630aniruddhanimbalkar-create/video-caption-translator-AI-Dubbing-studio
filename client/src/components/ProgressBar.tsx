import React, { useRef, useEffect } from 'react';
import { Card, ProgressBar as BSProgressBar, Badge } from 'react-bootstrap';
import { ProjectStatus } from '../types';

interface ProgressBarProps {
  progress: number;
  status: ProjectStatus;
  statusMessage: string;
  logs: string[];
  isProcessing: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  statusMessage,
  logs,
  isProcessing
}) => {
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom like python's self.text_area.see(tk.END)
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusBadge = () => {
    switch (status) {
      case 'extracting_audio':
        return <Badge bg="warning" className="text-dark">1. Extracting Audio</Badge>;
      case 'transcribing':
        return <Badge bg="primary">2. Speech Recognition</Badge>;
      case 'translating':
        return <Badge bg="info" className="text-dark">3. Translating</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'failed':
        return <Badge bg="danger">Error</Badge>;
      default:
        return <Badge bg="secondary">Ready</Badge>;
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25">
      <Card.Body className="p-3">
        {/* Status Header */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Pipeline Status:</span>
            {getStatusBadge()}
          </div>
          <div className="fw-bold text-info" style={{ fontFamily: 'monospace' }}>
            {Math.round(progress)}%
          </div>
        </div>

        {/* Animated Progress Bar */}
        <BSProgressBar
          now={progress}
          animated={isProcessing}
          striped={isProcessing}
          variant={status === 'failed' ? 'danger' : status === 'completed' ? 'success' : 'primary'}
          style={{ height: '10px' }}
          className="mb-2"
        />

        {/* Latest message highlight */}
        <div className="d-flex align-items-center gap-2 text-truncate small mb-2">
          {isProcessing && (
            <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
          )}
          <span className="text-light fw-medium">{statusMessage || 'Idle'}</span>
        </div>

        {/* Live Processing Activity Terminal (mimics Python progress log area) */}
        <div
          ref={logTerminalRef}
          className="bg-black rounded p-2 border border-secondary border-opacity-25"
          style={{
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            lineHeight: 1.4
          }}
        >
          {logs.length === 0 ? (
            <div className="text-secondary fst-italic">// Activity logs will appear here during processing...</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`py-0.5 ${
                  log.includes('Recognized')
                    ? 'text-success'
                    : log.includes('Error')
                    ? 'text-danger'
                    : log.includes('Translating')
                    ? 'text-warning'
                    : 'text-light text-opacity-75'
                }`}
              >
                <span className="text-secondary me-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

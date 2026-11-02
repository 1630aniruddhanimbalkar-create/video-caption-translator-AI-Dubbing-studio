import React from 'react';
import { Card, Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import { api } from '../services/api';

interface ExportControlsProps {
  projectId?: string;
  hasCaptions: boolean;
  onRetranslate?: () => void;
  isProcessing: boolean;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  projectId,
  hasCaptions,
  onRetranslate,
  isProcessing
}) => {
  const handleDownload = (format: 'srt' | 'vtt' | 'txt' | 'json', useTranslation: boolean) => {
    if (!projectId) return;
    const url = api.getExportUrl(projectId, format, useTranslation);
    window.open(url, '_blank');
  };

  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25">
      <Card.Body className="p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-download text-primary fs-5"></i>
          <span className="fw-semibold">Export & Download Subtitles</span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Download Translated Subtitles */}
          <Dropdown as={ButtonGroup} size="sm">
            <Button
              variant="primary"
              disabled={!hasCaptions || isProcessing}
              onClick={() => handleDownload('srt', true)}
            >
              <i className="bi bi-file-earmark-text me-1"></i>
              Download SRT (Translated)
            </Button>
            <Dropdown.Toggle split variant="primary" disabled={!hasCaptions || isProcessing} />
            <Dropdown.Menu className="dropdown-menu-dark">
              <Dropdown.Item onClick={() => handleDownload('srt', true)}>
                SubRip Subtitle (.srt)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload('vtt', true)}>
                WebVTT Subtitle (.vtt)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload('txt', true)}>
                Plain Text (.txt)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload('json', true)}>
                Full Data (.json)
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Download Original Subtitles */}
          <Dropdown as={ButtonGroup} size="sm">
            <Button
              variant="outline-secondary"
              disabled={!hasCaptions || isProcessing}
              onClick={() => handleDownload('srt', false)}
            >
              Original (.srt)
            </Button>
            <Dropdown.Toggle split variant="outline-secondary" disabled={!hasCaptions || isProcessing} />
            <Dropdown.Menu className="dropdown-menu-dark">
              <Dropdown.Item onClick={() => handleDownload('srt', false)}>
                SubRip Subtitle (.srt)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload('vtt', false)}>
                WebVTT Subtitle (.vtt)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload('txt', false)}>
                Plain Text (.txt)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload('json', false)}>
                Full Data (.json)
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Re-translate button */}
          {onRetranslate && (
            <Button
              variant="outline-warning"
              size="sm"
              disabled={!hasCaptions || isProcessing}
              onClick={onRetranslate}
              title="Translate to another language without re-extracting audio"
            >
              <i className="bi bi-arrow-repeat me-1"></i>
              Re-translate
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

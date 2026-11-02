import React, { useState } from 'react';
import { Card, Nav, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { SubtitleSegment } from '../types';

interface CaptionDisplayProps {
  originalText: string;
  translatedText: string;
  segments: SubtitleSegment[];
  targetLang: string;
  targetLangName: string;
  onOriginalTextChange?: (text: string) => void;
  onTranslatedTextChange?: (text: string) => void;
  onSegmentChange?: (index: number, field: 'text' | 'translatedText', value: string) => void;
  onSeekTo?: (seconds: number) => void;
  currentTime?: number;
}

function formatSeconds(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remainingSecs = Math.floor(secs % 60);
  const millis = Math.round((secs - Math.floor(secs)) * 10);
  return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}.${millis}`;
}

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({
  originalText,
  translatedText,
  segments,
  targetLang,
  targetLangName,
  onOriginalTextChange,
  onTranslatedTextChange,
  onSegmentChange,
  onSeekTo,
  currentTime = 0
}) => {
  const [activeTab, setActiveTab] = useState<'dual' | 'segments'>('dual');
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);

  const copyToClipboard = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedTranslated(true);
      setTimeout(() => setCopiedTranslated(false), 2000);
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25">
      <Card.Header className="bg-dark border-secondary border-opacity-25 py-2">
        <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)}>
          <Nav.Item>
            <Nav.Link eventKey="dual" className="py-1 px-3 d-flex align-items-center gap-2">
              <i className="bi bi-layout-split"></i>
              <span>Dual Text View (Python Style)</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="segments" className="py-1 px-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history"></i>
              <span>Timestamped Segments ({segments.length})</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Header>

      <Card.Body className="p-3">
        {/* Tab 1: Dual Text View (Matches Python main.py ScrolledText) */}
        {activeTab === 'dual' && (
          <Row className="g-3">
            {/* Original Text Box */}
            <Col md={6}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="secondary">Original</Badge>
                  <span className="fw-semibold text-light">Original Speech Transcript</span>
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => copyToClipboard(originalText, true)}
                  disabled={!originalText}
                  className="py-0 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  <i className={`bi ${copiedOriginal ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                  {copiedOriginal ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <Form.Control
                as="textarea"
                rows={12}
                value={originalText}
                onChange={(e) => onOriginalTextChange && onOriginalTextChange(e.target.value)}
                placeholder="Original recognized speech captions will appear here..."
                className="bg-black text-light border-secondary border-opacity-50 caption-textarea"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  resize: 'vertical'
                }}
              />
            </Col>

            {/* Translated Text Box */}
            <Col md={6}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="primary">Translated</Badge>
                  <span className="fw-semibold text-light">
                    Translated Text ({targetLangName || targetLang.toUpperCase()})
                  </span>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => copyToClipboard(translatedText, false)}
                  disabled={!translatedText}
                  className="py-0 px-2"
                  style={{ fontSize: '0.75rem' }}
                >
                  <i className={`bi ${copiedTranslated ? 'bi-check2' : 'bi-clipboard'} me-1`}></i>
                  {copiedTranslated ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <Form.Control
                as="textarea"
                rows={12}
                value={translatedText}
                onChange={(e) => onTranslatedTextChange && onTranslatedTextChange(e.target.value)}
                placeholder="Translated captions will appear here..."
                className="bg-black text-warning border-secondary border-opacity-50 caption-textarea"
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  resize: 'vertical'
                }}
              />
            </Col>
          </Row>
        )}

        {/* Tab 2: Timestamped Subtitle Segments */}
        {activeTab === 'segments' && (
          <div style={{ maxHeight: '450px', overflowY: 'auto' }} className="pe-2">
            {segments.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-chat-square-quote display-5 mb-2 d-block"></i>
                <p>No subtitle segments available yet. Generate captions to view chunked timestamps.</p>
              </div>
            ) : (
              segments.map((seg, i) => {
                const isActive = currentTime >= seg.start && currentTime <= seg.end;
                return (
                  <div
                    key={seg.index || i}
                    className={`p-2 rounded mb-2 border transition-all ${
                      isActive
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-secondary border-opacity-25 bg-black'
                    }`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={isActive ? 'primary' : 'secondary'} pill>
                          #{seg.index || i + 1}
                        </Badge>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => onSeekTo && onSeekTo(seg.start)}
                          className="p-0 text-decoration-none text-info font-monospace"
                          style={{ fontSize: '0.8rem' }}
                          title="Click to jump video to this timestamp"
                        >
                          <i className="bi bi-play-fill"></i>
                          {formatSeconds(seg.start)} &rarr; {formatSeconds(seg.end)}
                        </Button>
                      </div>

                      {/* Listen to segment speech */}
                      <div>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                          title="Listen to AI voice for this translated segment"
                          onClick={() => {
                            const textToSpeak = seg.translatedText || seg.text;
                            if (textToSpeak) {
                              const audioUrl = `/api/projects/tts/speak?text=${encodeURIComponent(textToSpeak)}&lang=${encodeURIComponent(targetLang)}`;
                              const audio = new Audio(audioUrl);
                              audio.play().catch(e => console.warn('Audio play error:', e));
                            }
                          }}
                        >
                          <i className="bi bi-volume-up-fill me-1"></i>
                          <span>Listen</span>
                        </Button>
                      </div>
                    </div>

                    <Row className="g-2">
                      <Col md={6}>
                        <Form.Control
                          size="sm"
                          value={seg.text}
                          onChange={(e) =>
                            onSegmentChange && onSegmentChange(i, 'text', e.target.value)
                          }
                          className="bg-dark text-white border-secondary border-opacity-50"
                          placeholder="Original segment text..."
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          size="sm"
                          value={seg.translatedText || ''}
                          onChange={(e) =>
                            onSegmentChange && onSegmentChange(i, 'translatedText', e.target.value)
                          }
                          className="bg-dark text-warning border-secondary border-opacity-50"
                          placeholder="Translated segment text..."
                        />
                      </Col>
                    </Row>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

import React from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import { SupportedLanguage } from '../types';

interface LanguageSelectorProps {
  targetLang: string;
  setTargetLang: (code: string) => void;
  languages: SupportedLanguage[];
  onGenerate: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

const POPULAR_LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' }
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  targetLang,
  setTargetLang,
  languages,
  onGenerate,
  isProcessing,
  disabled
}) => {
  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25">
      <Card.Body className="p-3">
        <Row className="align-items-center g-3">
          {/* Target Language Dropdown and Code Input */}
          <Col md={7} lg={8}>
            <Form.Label className="fw-semibold text-light mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-translate text-warning"></i>
              Translate Captions To:
            </Form.Label>

            <div className="d-flex align-items-center gap-2">
              {/* Select Dropdown */}
              <Form.Select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={isProcessing}
                className="bg-dark text-white border-secondary shadow-none"
                style={{ minWidth: '180px' }}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </Form.Select>

              {/* Exact code entry matching python entry */}
              <div className="d-flex align-items-center gap-1" style={{ width: '130px' }}>
                <Form.Control
                  type="text"
                  value={targetLang}
                  placeholder="e.g. es"
                  onChange={(e) => setTargetLang(e.target.value.toLowerCase().trim())}
                  disabled={isProcessing}
                  className="bg-dark text-white border-secondary text-center fw-mono"
                  style={{ textTransform: 'lowercase' }}
                />
              </div>
            </div>

            {/* Quick Select Badges */}
            <div className="d-flex align-items-center gap-1 flex-wrap mt-2">
              <small className="text-muted me-1">Popular:</small>
              {POPULAR_LANGUAGES.map((item) => (
                <Badge
                  key={item.code}
                  bg={targetLang === item.code ? 'primary' : 'secondary'}
                  className="cursor-pointer px-2 py-1"
                  style={{ cursor: 'pointer', opacity: targetLang === item.code ? 1 : 0.6 }}
                  onClick={() => !isProcessing && setTargetLang(item.code)}
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          </Col>

          {/* Action Button: Generate Captions */}
          <Col md={5} lg={4} className="text-md-end">
            <Button
              variant="success"
              size="lg"
              disabled={disabled || isProcessing}
              onClick={onGenerate}
              className="w-100 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Processing Video...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-magic fs-5"></i>
                  <span>Generate Captions</span>
                </>
              )}
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

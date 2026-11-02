import React, { useState } from 'react';
import { Card, Button, Badge, Spinner, Row, Col, Alert } from 'react-bootstrap';
import { VideoProject } from '../types';

interface AudioDubbingPanelProps {
  project: VideoProject | null;
  onGenerateAudio: () => Promise<void>;
  onGenerateDubbedVideo: () => Promise<void>;
  onSwitchVideoSource: (videoUrl: string) => void;
  activeVideoUrl?: string;
  isProcessing: boolean;
}

export const AudioDubbingPanel: React.FC<AudioDubbingPanelProps> = ({
  project,
  onGenerateAudio,
  onGenerateDubbedVideo,
  onSwitchVideoSource,
  activeVideoUrl,
  isProcessing
}) => {
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingDub, setGeneratingDub] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasTranslation = Boolean(project?.translatedText && project.translatedText.trim());
  const hasAudio = Boolean(project?.translatedAudioPath);
  const hasDubbedVideo = Boolean(project?.dubbedVideoPath);
  const isPlayingDubbed = Boolean(project?.dubbedVideoPath && activeVideoUrl === project.dubbedVideoPath);

  const handleCreateAudio = async () => {
    if (!project) return;
    setGeneratingAudio(true);
    setMessage(null);
    try {
      await onGenerateAudio();
      setMessage('AI translated voice audio created successfully!');
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to generate audio'}`);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleCreateDub = async () => {
    if (!project) return;
    setGeneratingDub(true);
    setMessage(null);
    try {
      await onGenerateDubbedVideo();
      setMessage('Dubbed video created successfully with translated audio track!');
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Failed to generate dubbed video'}`);
    } finally {
      setGeneratingDub(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25">
      <Card.Header className="bg-dark border-secondary border-opacity-25 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-soundwave text-info fs-5"></i>
          <span className="fw-semibold">AI Voice Dubbing & Speech Audio Studio</span>
          <Badge bg="info" className="text-dark">AI Audio Tool</Badge>
        </div>

        <div>
          {hasAudio ? (
            <Badge bg="success">
              <i className="bi bi-check-circle me-1"></i>Voice Audio Ready
            </Badge>
          ) : (
            <Badge bg="secondary">No Audio Generated Yet</Badge>
          )}
        </div>
      </Card.Header>

      <Card.Body className="p-3">
        {message && (
          <Alert variant={message.startsWith('Error') ? 'danger' : 'success'} dismissible onClose={() => setMessage(null)} className="py-2 small mb-3">
            {message}
          </Alert>
        )}

        <Row className="g-3 align-items-center">
          {/* Action 1: Generate Speech Audio */}
          <Col md={6}>
            <div className="mb-2">
              <span className="fw-semibold small text-light">1. Synthesize Translated Speech (TTS):</span>
              <p className="text-muted small mb-2">
                Generates a continuous AI speech audio file (.mp3) from the translated captions in <strong>{project?.targetLanguage?.toUpperCase() || 'TARGET'}</strong> language.
              </p>

              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!hasTranslation || isProcessing || generatingAudio}
                  onClick={handleCreateAudio}
                  className="d-flex align-items-center gap-2 px-3 fw-medium"
                >
                  {generatingAudio ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Synthesizing Voice...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-volume-up-fill"></i>
                      <span>{hasAudio ? 'Re-generate AI Audio' : 'Generate AI Voice Audio (.mp3)'}</span>
                    </>
                  )}
                </Button>

                {hasAudio && project?.translatedAudioPath && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    href={project.translatedAudioPath}
                    download={`translated_speech_${project.targetLanguage}.mp3`}
                    target="_blank"
                    className="d-flex align-items-center gap-1"
                    title="Download translated speech audio file"
                  >
                    <i className="bi bi-download"></i>
                    <span>Download MP3</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Embedded Audio Player */}
            {hasAudio && project?.translatedAudioPath && (
              <div className="bg-black p-2 rounded border border-secondary border-opacity-25 mt-2">
                <small className="text-muted d-block mb-1">
                  <i className="bi bi-headphones me-1 text-primary"></i> Preview Translated Speech Audio:
                </small>
                <audio
                  controls
                  src={project.translatedAudioPath}
                  className="w-100"
                  style={{ height: '36px' }}
                />
              </div>
            )}
          </Col>

          {/* Action 2: Dub Video with Audio Track */}
          <Col md={6}>
            <div className="mb-2">
              <span className="fw-semibold small text-light">2. Dub Video with AI Voice Track:</span>
              <p className="text-muted small mb-2">
                Muxes the translated audio with the video stream, replacing original speech with the AI synthesized voice.
              </p>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Button
                  variant="warning"
                  size="sm"
                  disabled={!hasTranslation || isProcessing || generatingDub}
                  onClick={handleCreateDub}
                  className="d-flex align-items-center gap-2 px-3 fw-medium text-dark"
                >
                  {generatingDub ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Dubbing Video...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-camera-video-fill"></i>
                      <span>{hasDubbedVideo ? 'Re-dub Video' : 'Create Dubbed Video (.mp4)'}</span>
                    </>
                  )}
                </Button>

                {hasDubbedVideo && project?.dubbedVideoPath && (
                  <>
                    <Button
                      variant={isPlayingDubbed ? 'success' : 'outline-light'}
                      size="sm"
                      onClick={() => onSwitchVideoSource(isPlayingDubbed ? project.videoPath : project.dubbedVideoPath!)}
                      className="d-flex align-items-center gap-1"
                    >
                      <i className={`bi ${isPlayingDubbed ? 'bi-check-circle-fill' : 'bi-play-fill'}`}></i>
                      <span>{isPlayingDubbed ? 'Playing Dubbed Video' : 'Watch Dubbed Video'}</span>
                    </Button>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      href={project.dubbedVideoPath}
                      download={`dubbed_video_${project.targetLanguage}.mp4`}
                      target="_blank"
                      title="Download dubbed video file"
                    >
                      <i className="bi bi-download"></i>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

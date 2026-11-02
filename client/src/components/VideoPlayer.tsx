import React, { useRef, useState, useEffect } from 'react';
import { Card, Button, ButtonGroup, Badge } from 'react-bootstrap';
import { SubtitleSegment } from '../types';

interface VideoPlayerProps {
  videoUrl?: string;
  segments: SubtitleSegment[];
  targetLangName: string;
  onTimeUpdate?: (currentTime: number) => void;
  playerRef?: React.MutableRefObject<HTMLVideoElement | null>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  segments,
  targetLangName,
  onTimeUpdate,
  playerRef
}) => {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeVideoRef = playerRef || internalVideoRef;

  const [currentTime, setCurrentTime] = useState(0);
  const [subtitleMode, setSubtitleMode] = useState<'translated' | 'original' | 'both' | 'off'>('translated');

  const handleTimeUpdate = () => {
    if (activeVideoRef.current) {
      const time = activeVideoRef.current.currentTime;
      setCurrentTime(time);
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    }
  };

  // Find active segment for current playback timestamp
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25 overflow-hidden">
      <Card.Header className="bg-dark border-secondary border-opacity-25 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-play-circle-fill text-danger fs-5"></i>
          <span className="fw-semibold">Video Preview & Synchronized Subtitles</span>
        </div>

        {/* Subtitle Display Mode Controls */}
        <div className="d-flex align-items-center gap-2">
          <small className="text-muted">Captions:</small>
          <ButtonGroup size="sm">
            <Button
              variant={subtitleMode === 'translated' ? 'primary' : 'outline-secondary'}
              onClick={() => setSubtitleMode('translated')}
              title="Show translated subtitles"
            >
              {targetLangName || 'Translated'}
            </Button>
            <Button
              variant={subtitleMode === 'original' ? 'primary' : 'outline-secondary'}
              onClick={() => setSubtitleMode('original')}
              title="Show original speech captions"
            >
              Original
            </Button>
            <Button
              variant={subtitleMode === 'both' ? 'primary' : 'outline-secondary'}
              onClick={() => setSubtitleMode('both')}
              title="Dual subtitles"
            >
              Dual
            </Button>
            <Button
              variant={subtitleMode === 'off' ? 'danger' : 'outline-secondary'}
              onClick={() => setSubtitleMode('off')}
              title="Turn subtitles off"
            >
              Off
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>

      <Card.Body className="p-0 position-relative bg-black d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        {videoUrl ? (
          <div className="w-100 position-relative">
            <video
              ref={activeVideoRef}
              src={videoUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              className="w-100 d-block"
              style={{ maxHeight: '420px', objectFit: 'contain' }}
            />

            {/* Floating Synchronized Subtitle Overlay on Video */}
            {subtitleMode !== 'off' && activeSegment && (
              <div
                className="position-absolute bottom-0 start-50 translate-middle-x mb-5 px-3 py-2 text-center text-white rounded"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.78)',
                  backdropFilter: 'blur(4px)',
                  maxWidth: '85%',
                  pointerEvents: 'none',
                  zIndex: 10,
                  fontSize: '1.05rem',
                  lineHeight: '1.4'
                }}
              >
                {/* Translated subtitle line */}
                {(subtitleMode === 'translated' || subtitleMode === 'both') && (
                  <div className="fw-bold text-warning">
                    {activeSegment.translatedText || activeSegment.text}
                  </div>
                )}

                {/* Original subtitle line */}
                {(subtitleMode === 'original' || subtitleMode === 'both') && (
                  <div className={subtitleMode === 'both' ? 'small text-light opacity-75 mt-1' : 'fw-bold text-light'}>
                    {activeSegment.text}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-file-earmark-play display-4 mb-2 d-block"></i>
            <p className="mb-0">Select and process a video to preview video playback with live captions</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

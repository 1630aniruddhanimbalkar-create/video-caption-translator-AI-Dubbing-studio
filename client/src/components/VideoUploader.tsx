import React, { useRef, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  uploadedFileName?: string;
  isProcessing: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onFileSelect,
  selectedFile,
  uploadedFileName,
  isProcessing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mkv')) {
        onFileSelect(file);
      }
    }
  };

  const displayFileName = selectedFile
    ? selectedFile.name
    : uploadedFileName
    ? uploadedFileName
    : 'No file selected';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card className="shadow-sm border-0 mb-3 bg-dark text-white border border-secondary border-opacity-25">
      <Card.Body className="p-3">
        <Form.Label className="fw-semibold text-light mb-2 d-flex align-items-center gap-2">
          <i className="bi bi-file-earmark-play-fill text-primary"></i>
          Select Video File (MP4, MKV, MOV, WebM)
        </Form.Label>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.mkv,.mov,.webm,.avi"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Drag & Drop / Selection Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`upload-dropzone p-3 rounded d-flex align-items-center justify-content-between flex-wrap gap-2 ${
            isDragging ? 'drag-active' : ''
          }`}
          style={{
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className={`file-icon-box rounded p-2 d-flex align-items-center justify-content-center ${
                selectedFile || uploadedFileName ? 'bg-primary text-white' : 'bg-secondary text-light'
              }`}
              style={{ width: '42px', height: '42px' }}
            >
              <i className="bi bi-film fs-5"></i>
            </div>
            <div>
              <div className="fw-semibold text-truncate" style={{ maxWidth: '400px' }}>
                {displayFileName}
              </div>
              <small className="text-muted">
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} • Click or drop to change`
                  : 'Click Browse or drag & drop video file here'}
              </small>
            </div>
          </div>

          <Button
            variant="outline-primary"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="d-flex align-items-center gap-2 px-3 fw-medium"
          >
            <i className="bi bi-folder2-open"></i>
            <span>Browse</span>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

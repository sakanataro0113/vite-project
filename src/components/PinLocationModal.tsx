import React, { useState, useEffect, useRef } from 'react';

interface PinLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefecture: string;
  initialX?: number;
  initialY?: number;
  onConfirm: (x: number, y: number) => void;
}

const PinLocationModal: React.FC<PinLocationModalProps> = ({
  isOpen,
  onClose,
  prefecture,
  initialX = 50,
  initialY = 50,
  onConfirm
}) => {
  const [pinX, setPinX] = useState(initialX);
  const [pinY, setPinY] = useState(initialY);
  const [isDragging, setIsDragging] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SVG地図を読み込む
    fetch('/map-full.svg')
      .then(res => res.text())
      .then(svg => setSvgContent(svg))
      .catch(err => console.error('Failed to load map:', err));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPinX(initialX);
      setPinY(initialY);
    }
  }, [isOpen, initialX, initialY]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPinX(Math.max(0, Math.min(100, x)));
    setPinY(Math.max(0, Math.min(100, y)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPinX(Math.max(0, Math.min(100, x)));
    setPinY(Math.max(0, Math.min(100, y)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    onConfirm(pinX, pinY);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>ピンの位置を設定</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            {prefecture}の地図上でクリックまたはドラッグしてピンを配置してください
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#999' }}>
            現在の座標: X={pinX.toFixed(2)}, Y={pinY.toFixed(2)}
          </p>
        </div>

        <div
          ref={mapContainerRef}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '800px',
            maxWidth: '100%',
            aspectRatio: '1',
            border: '2px solid #ccc',
            borderRadius: '8px',
            cursor: isDragging ? 'grabbing' : 'crosshair',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {/* SVG地図 */}
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />

          {/* ドラッグ可能なピン */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              left: `${pinX}%`,
              top: `${pinY}%`,
              transform: 'translate(-50%, -100%)',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 100,
              pointerEvents: 'auto'
            }}
          >
            <svg width="20" height="32" viewBox="0 0 20 32">
              {/* 針の本体（金属っぽい色） */}
              <rect
                x="9"
                y="8"
                width="2"
                height="24"
                fill="url(#metalGradient)"
              />
              {/* ピンの頭（円形） */}
              <circle
                cx="10"
                cy="6"
                r="6"
                fill="#ff4444"
                stroke="#cc0000"
                strokeWidth="1"
              />
              {/* ピンの頭の中心 */}
              <circle
                cx="10"
                cy="6"
                r="3"
                fill="white"
                opacity="0.7"
              />
              {/* 金属のグラデーション定義 */}
              <defs>
                <linearGradient id="metalGradientModal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#5a5a5a', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#c0c0c0', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#5a5a5a', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            この位置に決定
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinLocationModal;

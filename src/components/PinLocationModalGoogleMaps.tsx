import React, { useState } from 'react';
import GoogleMapComponent from './GoogleMapComponent';

interface PinLocationModalGoogleMapsProps {
  isOpen: boolean;
  onClose: () => void;
  prefecture: string;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
}

const PinLocationModalGoogleMaps: React.FC<PinLocationModalGoogleMapsProps> = ({
  isOpen,
  onClose,
  prefecture,
  initialLat = 36.2048,
  initialLng = 138.2529,
  onConfirm
}) => {
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  };

  const handleConfirm = () => {
    onConfirm(selectedLat, selectedLng);
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
          width: '900px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>ピンの位置を設定</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            {prefecture}の地図上でクリックしてピンを配置してください
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#059669', fontWeight: '500' }}>
            現在の座標: 緯度 {selectedLat.toFixed(6)}, 経度 {selectedLng.toFixed(6)}
          </p>
        </div>

        <GoogleMapComponent
          locations={[]}
          onMapClick={handleMapClick}
          clickableForPinPlacement={true}
          height="500px"
        />

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

export default PinLocationModalGoogleMaps;

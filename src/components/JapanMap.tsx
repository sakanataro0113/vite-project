import React, { useState, useEffect } from 'react';

// 都道府県の座標（パーセント位置、0-100の範囲）
export const prefectureCoordinates: { [key: string]: { x: number; y: number } } = {
  '北海道': { x: 75, y: 10 },
  '青森': { x: 72, y: 22 },
  '岩手': { x: 73, y: 27 },
  '宮城': { x: 73, y: 32 },
  '秋田': { x: 68, y: 27 },
  '山形': { x: 68, y: 32 },
  '福島': { x: 70, y: 37 },
  '茨城': { x: 72, y: 42 },
  '栃木': { x: 68, y: 42 },
  '群馬': { x: 65, y: 42 },
  '埼玉': { x: 65, y: 45 },
  '千葉': { x: 72, y: 45 },
  '東京': { x: 67, y: 47 },
  '神奈川': { x: 65, y: 48 },
  '新潟': { x: 62, y: 35 },
  '富山': { x: 57, y: 40 },
  '石川': { x: 55, y: 40 },
  '福井': { x: 53, y: 43 },
  '山梨': { x: 62, y: 47 },
  '長野': { x: 60, y: 44 },
  '岐阜': { x: 57, y: 47 },
  '静岡': { x: 60, y: 50 },
  '愛知': { x: 57, y: 50 },
  '三重': { x: 55, y: 52 },
  '滋賀': { x: 52, y: 48 },
  '京都': { x: 50, y: 48 },
  '大阪': { x: 50, y: 51 },
  '兵庫': { x: 48, y: 50 },
  '奈良': { x: 52, y: 52 },
  '和歌山': { x: 50, y: 55 },
  '鳥取': { x: 45, y: 47 },
  '島根': { x: 40, y: 48 },
  '岡山': { x: 45, y: 51 },
  '広島': { x: 40, y: 51 },
  '山口': { x: 35, y: 52 },
  '徳島': { x: 47, y: 55 },
  '香川': { x: 45, y: 54 },
  '愛媛': { x: 40, y: 55 },
  '高知': { x: 43, y: 58 },
  '福岡': { x: 28, y: 55 },
  '佐賀': { x: 25, y: 56 },
  '長崎': { x: 22, y: 57 },
  '熊本': { x: 25, y: 60 },
  '大分': { x: 30, y: 58 },
  '宮崎': { x: 30, y: 65 },
  '鹿児島': { x: 25, y: 70 },
  '沖縄': { x: 20, y: 85 }
};

export type MapLocation = {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id?: number;
  x_coordinate?: number | null;
  y_coordinate?: number | null;
  created_at: string;
};

type JapanMapProps = {
  locations: MapLocation[];
  onPinClick?: (location: MapLocation) => void;
};

const JapanMap: React.FC<JapanMapProps> = ({ locations, onPinClick }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // SVGファイルを読み込む
  useEffect(() => {
    const mapSrc = isMobile ? '/map-mobile.svg' : '/map-full.svg';

    fetch(mapSrc)
      .then(res => res.text())
      .then(svg => setSvgContent(svg))
      .catch(err => console.error('Failed to load map:', err));
  }, [isMobile]);

  return (
    <div style={{ position: 'relative', width: '100%', maxHeight: '800px' }}>
      {/* Geoloniaの日本地図SVG（インライン埋め込み） */}
      <div
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{
          width: '100%',
          border: '1px solid #ccc',
          borderRadius: '8px'
        }}
      />

      {/* ピンを絶対配置で重ねる */}
      {locations.map((location) => {
        // カスタム座標があればそれを使用、なければ都道府県座標
        let x, y;
        if (location.x_coordinate !== null && location.x_coordinate !== undefined &&
            location.y_coordinate !== null && location.y_coordinate !== undefined) {
          x = location.x_coordinate;
          y = location.y_coordinate;
        } else {
          const coords = prefectureCoordinates[location.prefecture];
          if (!coords) return null;
          x = coords.x;
          y = coords.y;
        }

        return (
          <div
            key={location.id}
            onClick={() => onPinClick?.(location)}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -100%)',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            {/* ピン */}
            <svg width="24" height="32" viewBox="0 0 24 32">
              {/* ピンの影 */}
              <ellipse
                cx="12"
                cy="30"
                rx="4"
                ry="2"
                fill="rgba(0,0,0,0.3)"
              />
              {/* ピン本体 */}
              <path
                d="M12 0 C7 0 3 4 3 9 C3 14 12 24 12 24 S21 14 21 9 C21 4 17 0 12 0 Z"
                fill="#ff4444"
                stroke="#cc0000"
                strokeWidth="1"
              />
              {/* ピンの中心 */}
              <circle
                cx="12"
                cy="9"
                r="4"
                fill="white"
                opacity="0.7"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

export default JapanMap;

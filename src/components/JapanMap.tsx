import React from 'react';

// 都道府県の座標（相対位置、0-100の範囲）
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
  created_at: string;
};

type JapanMapProps = {
  locations: MapLocation[];
  onPinClick?: (location: MapLocation) => void;
};

const JapanMap: React.FC<JapanMapProps> = ({ locations, onPinClick }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      style={{ maxHeight: '800px', border: '1px solid #ccc', borderRadius: '8px' }}
    >
      {/* 背景 */}
      <rect width="100" height="100" fill="#e6f3ff" />

      {/* 日本列島の簡略化された輪郭 */}
      <path
        d="M 75 15 Q 78 12 78 18 Q 78 25 75 28 L 72 35 L 70 40 L 68 35 L 65 40 L 62 38 L 60 42 L 58 45 L 55 42 L 52 45 L 50 48 L 48 52 L 45 50 L 42 52 L 38 50 L 35 53 L 32 55 L 28 58 L 25 62 L 22 68 L 20 75 L 18 82 L 20 88 L 25 88 L 28 85 L 30 80 L 32 75 L 35 72 L 38 75 L 40 78 L 43 75 L 45 72 L 48 75 L 50 78 L 52 75 L 55 78 L 58 75 L 60 78 L 63 75 L 65 78 L 68 75 L 70 72 L 72 68 L 75 65 L 78 60 L 80 55 L 78 50 L 75 45 L 73 40 L 75 35 L 78 30 L 77 25 L 75 20 Z"
        fill="#b8e6b8"
        stroke="#4a7c59"
        strokeWidth="0.3"
        opacity="0.7"
      />

      {/* ピン表示 */}
      {locations.map((location) => {
        const coords = prefectureCoordinates[location.prefecture];
        if (!coords) return null;

        return (
          <g
            key={location.id}
            onClick={() => onPinClick?.(location)}
            style={{ cursor: 'pointer' }}
          >
            {/* ピンの影 */}
            <ellipse
              cx={coords.x}
              cy={coords.y + 1.5}
              rx="0.8"
              ry="0.3"
              fill="rgba(0,0,0,0.3)"
            />
            {/* ピン本体 */}
            <circle
              cx={coords.x}
              cy={coords.y}
              r="1.2"
              fill="#ff4444"
              stroke="#cc0000"
              strokeWidth="0.2"
            />
            {/* ピンの中心 */}
            <circle
              cx={coords.x}
              cy={coords.y}
              r="0.5"
              fill="white"
              opacity="0.7"
            />
            {/* ホバー効果用の透明な大きな円 */}
            <circle
              cx={coords.x}
              cy={coords.y}
              r="2"
              fill="transparent"
              className="hover:fill-[rgba(255,68,68,0.2)]"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default JapanMap;

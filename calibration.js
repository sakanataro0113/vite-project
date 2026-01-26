// 座標変換の校正スクリプト
// 既存のprefectureCoordinatesと実際の緯度経度から最適な変換パラメータを求める

const referencePoints = [
  { name: '東京', lat: 35.6762, lon: 139.6503, x: 67, y: 47 },
  { name: '北海道', lat: 43.0642, lon: 141.3469, x: 75, y: 10 },
  { name: '神奈川', lat: 35.4478, lon: 139.6425, x: 65, y: 48 },
  { name: '大阪', lat: 34.6937, lon: 135.5023, x: 50, y: 51 },
  { name: '福岡', lat: 33.5904, lon: 130.4017, x: 28, y: 55 },
  { name: '愛知', lat: 35.1802, lon: 136.9066, x: 57, y: 50 },
  { name: '兵庫', lat: 34.6913, lon: 135.1830, x: 48, y: 50 },
];

// Y座標 = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100
// 東京: 47 = ((LAT_MAX - 35.6762) / (LAT_MAX - LAT_MIN)) * 100
// 北海道: 10 = ((LAT_MAX - 43.0642) / (LAT_MAX - LAT_MIN)) * 100

// 2点から連立方程式を解く
function solve2Points(p1, p2) {
  // y1 = ((LAT_MAX - lat1) / (LAT_MAX - LAT_MIN)) * 100
  // y2 = ((LAT_MAX - lat2) / (LAT_MAX - LAT_MIN)) * 100

  // y1/100 = (LAT_MAX - lat1) / (LAT_MAX - LAT_MIN)
  // y2/100 = (LAT_MAX - lat2) / (LAT_MAX - LAT_MIN)

  // y1/100 * (LAT_MAX - LAT_MIN) = LAT_MAX - lat1
  // y2/100 * (LAT_MAX - LAT_MIN) = LAT_MAX - lat2

  // y1/100 * LAT_MAX - y1/100 * LAT_MIN = LAT_MAX - lat1
  // y2/100 * LAT_MAX - y2/100 * LAT_MIN = LAT_MAX - lat2

  // (y1/100 - 1) * LAT_MAX = lat1 - y1/100 * LAT_MIN
  // (y2/100 - 1) * LAT_MAX = lat2 - y2/100 * LAT_MIN

  const a1 = p1.y / 100 - 1;
  const b1 = -p1.y / 100;
  const c1 = -p1.lat;

  const a2 = p2.y / 100 - 1;
  const b2 = -p2.y / 100;
  const c2 = -p2.lat;

  // a1 * LAT_MAX + b1 * LAT_MIN = c1
  // a2 * LAT_MAX + b2 * LAT_MIN = c2

  const det = a1 * b2 - a2 * b1;
  const LAT_MAX = (c1 * b2 - c2 * b1) / det;
  const LAT_MIN = (a1 * c2 - a2 * c1) / det;

  // 経度も同様
  // x/100 * LON_MAX + (1 - x/100) * LON_MIN = lon
  const a1x = p1.x / 100;
  const b1x = 1 - p1.x / 100;
  const c1x = p1.lon;

  const a2x = p2.x / 100;
  const b2x = 1 - p2.x / 100;
  const c2x = p2.lon;

  const detx = a1x * b2x - a2x * b1x;
  const LON_MAX = (c1x * b2x - c2x * b1x) / detx;
  const LON_MIN = (a1x * c2x - a2x * c1x) / detx;

  return { LAT_MIN, LAT_MAX, LON_MIN, LON_MAX };
}

// 東京と北海道を使って計算
const tokyo = referencePoints[0];
const hokkaido = referencePoints[1];

const params = solve2Points(tokyo, hokkaido);
console.log('東京と北海道から計算:');
console.log(`LAT_MIN: ${params.LAT_MIN.toFixed(2)}, LAT_MAX: ${params.LAT_MAX.toFixed(2)}`);
console.log(`LON_MIN: ${params.LON_MIN.toFixed(2)}, LON_MAX: ${params.LON_MAX.toFixed(2)}`);

// 各基準点での誤差を確認
console.log('\n各基準点での検証:');
referencePoints.forEach(p => {
  const y = ((params.LAT_MAX - p.lat) / (params.LAT_MAX - params.LAT_MIN)) * 100;
  const x = ((p.lon - params.LON_MIN) / (params.LON_MAX - params.LON_MIN)) * 100;
  const errorX = Math.abs(x - p.x);
  const errorY = Math.abs(y - p.y);
  console.log(`${p.name}: 計算値(${x.toFixed(1)}, ${y.toFixed(1)}) vs 期待値(${p.x}, ${p.y}) - 誤差(${errorX.toFixed(1)}, ${errorY.toFixed(1)})`);
});

// 箱根温泉でテスト
const hakone = { lat: 35.233850, lon: 139.09555 };
const hakoneY = ((params.LAT_MAX - hakone.lat) / (params.LAT_MAX - params.LAT_MIN)) * 100;
const hakoneX = ((hakone.lon - params.LON_MIN) / (params.LON_MAX - params.LON_MIN)) * 100;
console.log(`\n箱根温泉(${hakone.lat}, ${hakone.lon}): (${hakoneX.toFixed(2)}, ${hakoneY.toFixed(2)})`);
console.log(`神奈川のデフォルト: (65, 48)`);

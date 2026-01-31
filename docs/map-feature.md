# Map機能の解説

## 概要
このドキュメントでは、訪問した場所をGoogle Maps上にピンで表示し、各地点の詳細情報をカード形式で管理する「Map機能」について説明します。

**主な機能**:
- **Google Maps JavaScript API**を使用した正確な位置表示
- 訪問地点を複数マーカーで表示
- 地点の詳細情報（名前、都道府県、メモ）をカード形式で表示
- 既存の記事との関連付け
- マーカークリックで情報ウィンドウ表示
- 地図上でクリックしてピン位置を設定

**技術スタック**:
- Google Maps JavaScript API
- React + TypeScript
- Cloudflare Workers (Hono)
- Cloudflare D1 (SQLite)

---

## 1. 全体構成

### 1.1 ページレイアウト
**ファイル**: `src/components/MapPage.tsx`

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '1rem',
}}>
  {/* 左側: Google Maps（sticky） */}
  <div className="map-container">
    <GoogleMapComponent
      locations={locations}
      onLocationClick={handlePinClick}
      height="80vh"
    />
  </div>

  {/* 右側: カード一覧（スクロール可能） */}
  <div style={{
    maxHeight: '80vh',
    overflowY: 'auto',
  }}>
    {/* 地点カード */}
  </div>
</div>
```

**レイアウト特徴**:
- 左側にGoogle Maps（`position: sticky`で固定表示）
- 右側のカード一覧は独立してスクロール可能
- グリッドレイアウト（2:1の比率）で画面を分割
- レスポンシブ対応（モバイルでは1カラム）

---

## 2. 日本地図コンポーネント

### 2.1 都道府県座標定義
**ファイル**: `src/components/JapanMap.tsx:4-51`

```tsx
export const prefectureCoordinates: { [key: string]: { x: number; y: number } } = {
  '北海道': { x: 75, y: 10 },
  '青森': { x: 72, y: 22 },
  '東京': { x: 67, y: 47 },
  // ... 全47都道府県
};
```

**座標系**:
- SVGのviewBox `0 0 100 100` に基づく相対座標
- x: 横位置（0-100）
- y: 縦位置（0-100）
- 地図の見た目に合わせて手動調整済み

### 2.2 SVG地図の描画
**ファイル**: `src/components/JapanMap.tsx:62-90`

```tsx
<svg viewBox="0 0 100 100" className="w-full h-full">
  {/* 背景 */}
  <rect width="100" height="100" fill="#e6f3ff" />

  {/* 日本列島の輪郭 */}
  <path
    d="M 75 15 Q 78 12 78 18 ..."
    fill="#b8e6b8"
    stroke="#4a7c59"
  />

  {/* ピン表示 */}
  {locations.map((location) => {
    const coords = prefectureCoordinates[location.prefecture];
    return (
      <g onClick={() => onPinClick?.(location)}>
        <circle cx={coords.x} cy={coords.y} r="1.2" fill="#ff4444" />
      </g>
    );
  })}
</svg>
```

**SVG要素の構成**:
1. 背景（水色）
2. 日本列島の簡略化された輪郭（緑色）
3. 各地点のピン（赤色の円）
4. ホバー効果用の透明な円

### 2.3 ピンのスタイル
**ファイル**: `src/components/JapanMap.tsx:96-117`

```tsx
{/* ピンの影 */}
<ellipse cx={coords.x} cy={coords.y + 1.5} rx="0.8" ry="0.3" fill="rgba(0,0,0,0.3)" />

{/* ピン本体 */}
<circle cx={coords.x} cy={coords.y} r="1.2" fill="#ff4444" stroke="#cc0000" />

{/* ピンの中心（白い光） */}
<circle cx={coords.x} cy={coords.y} r="0.5" fill="white" opacity="0.7" />

{/* ホバー効果用の透明な円 */}
<circle
  cx={coords.x}
  cy={coords.y}
  r="2"
  fill="transparent"
  className="hover:fill-[rgba(255,68,68,0.2)]"
/>
```

**視覚効果**:
- 影: 楕円形でピンの下に配置
- 本体: 赤い円（#ff4444）
- 中心: 白い円で光沢感を表現
- ホバー: 赤い半透明の円が表示

---

## 3. カード表示

### 3.1 カードのデータ構造
**ファイル**: `src/components/JapanMap.tsx:53-60`

```tsx
export type MapLocation = {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id?: number;
  created_at: string;
};
```

### 3.2 カードのUI
**ファイル**: `src/components/MapPage.tsx:77-125`

```tsx
<div
  id={`location-card-${location.id}`}
  className="category-card border rounded-lg p-4 shadow-md mb-4"
  style={{
    backgroundColor: selectedLocation?.id === location.id ? '#fff3cd' : 'white',
  }}
>
  <p>ID: {location.id}</p>
  <h3>
    {location.name}
    <span>({location.prefecture})</span>
  </h3>
  <p>{location.memo}</p>

  {/* 関連記事へのリンク */}
  {location.linked_post_id && (
    <Link to={`/post/${location.linked_post_id}`}>
      関連記事を見る →
    </Link>
  )}

  <p>{new Date(location.created_at).toLocaleDateString()}</p>
  <button onClick={() => handleDelete(location.id)}>削除</button>
</div>
```

**カードの内容**:
- ID表示
- 地点名 + 都道府県
- メモ（詳細説明）
- 関連記事へのリンク（オプション）
- 作成日時
- 削除ボタン

### 3.3 カードの選択状態
**ファイル**: `src/components/MapPage.tsx:22-28`

```tsx
const handlePinClick = (location: MapLocation) => {
  setSelectedLocation(location);
  // カードまでスクロール
  const element = document.getElementById(`location-card-${location.id}`);
  element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
```

**動作**:
1. ピンをクリック
2. 対応するカードが選択状態（黄色背景）に
3. カードが見える位置まで自動スクロール

---

## 4. 地点の追加

### 4.1 フォームコンポーネント
**ファイル**: `src/components/MapPage.tsx:143-298`

```tsx
const MapLocationForm: React.FC<{ onSubmit: (location: MapLocation) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [prefecture, setPrefecture] = useState('東京');
  const [memo, setMemo] = useState('');
  const [linkedPostId, setLinkedPostId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    // FormDataを作成してPOST
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 入力フィールド */}
    </form>
  );
};
```

### 4.2 フォーム項目
**必須項目**:
- 場所の名前（例: "有馬温泉"）
- 都道府県（ドロップダウンで選択）
- メモ（詳細説明）
- パスワード（投稿時の認証）

**任意項目**:
- 関連する投稿ID（既存の記事とリンク）

### 4.3 データ送信
**ファイル**: `src/components/MapPage.tsx:160-188`

```tsx
const formData = new FormData();
formData.append('name', name);
formData.append('prefecture', prefecture);
formData.append('memo', memo);
formData.append('password', password);
if (linkedPostId) {
  formData.append('linked_post_id', linkedPostId);
}

const res = await fetch('/api/map-locations', {
  method: 'POST',
  body: formData,
});
```

---

## 5. バックエンドAPI

### 5.1 データ型定義
**ファイル**: `_worker.ts:35-42`

```typescript
type MapLocation = {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id: number | null;
  created_at: string;
};
```

### 5.2 地点一覧取得（GET）
**ファイル**: `_worker.ts:267-278`

```typescript
app.get('/api/map-locations', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM map_locations ORDER BY created_at DESC`
    ).all();

    return c.json({ success: true, locations: results as MapLocation[] });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to fetch map locations' }, 500);
  }
});
```

**機能**:
- 全地点を新しい順に取得
- 認証不要（読み取りのみ）

### 5.3 地点追加（POST）
**ファイル**: `_worker.ts:280-322`

```typescript
app.post('/api/map-locations', async (c) => {
  try {
    const formData = await c.req.formData();
    const password = formData.get('password') as string;

    // パスワードチェック
    if (password !== c.env.SECRET_KEY) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const name = formData.get('name') as string;
    const prefecture = formData.get('prefecture') as string;
    const memo = formData.get('memo') as string;
    const linked_post_id = formData.get('linked_post_id') as string | null;

    // バリデーション
    if (!name || !prefecture || !memo) {
      return c.json({ success: false, error: 'Name, prefecture, and memo are required' }, 400);
    }

    const created_at = new Date().toISOString();

    // データベースに挿入
    const result = await c.env.DB.prepare(
      `INSERT INTO map_locations (name, prefecture, memo, linked_post_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(name, prefecture, memo, linked_post_id || null, created_at).run();

    const locationId = result.meta.last_row_id;
    const newLocation = await c.env.DB.prepare(
      `SELECT * FROM map_locations WHERE id = ?`
    ).bind(locationId).first();

    return c.json({ success: true, message: 'Location added successfully', location: newLocation }, 201);

  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to add location' }, 500);
  }
});
```

**機能**:
- パスワード認証
- 必須項目のバリデーション
- データベースへの挿入
- 新規作成された地点を返す

### 5.4 地点削除（DELETE）
**ファイル**: `_worker.ts:324-352`

```typescript
app.delete('/api/map-locations/:id', async (c) => {
  try {
    const password = c.req.header('X-Auth-Password');
    if (!password || password !== c.env.SECRET_KEY) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const locationId = c.req.param('id');
    if (!locationId) {
      return c.json({ success: false, error: 'Location ID is required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `DELETE FROM map_locations WHERE id = ?`
    ).bind(locationId).run();

    if (result.meta.changes > 0) {
      return c.json({ success: true, message: 'Location deleted successfully' });
    } else {
      return c.json({ success: false, error: 'Location not found' }, 404);
    }

  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ success: false, error: `Failed to delete location: ${errorMessage}` }, 500);
  }
});
```

**機能**:
- パスワード認証（ヘッダー経由）
- IDによる削除
- 削除成功/失敗のレスポンス

---

## 6. データベーススキーマ

### map_locationsテーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INTEGER | 主キー（自動採番） |
| name | TEXT | 地点名（必須） |
| prefecture | TEXT | 都道府県名（必須） |
| memo | TEXT | メモ・詳細説明（必須） |
| linked_post_id | INTEGER | 関連する記事のID（NULL可） |
| **latitude** | **REAL** | **緯度（推奨、NULL可）** |
| **longitude** | **REAL** | **経度（推奨、NULL可）** |
| x_coordinate | REAL | X座標 0-100（後方互換性、NULL可） |
| y_coordinate | REAL | Y座標 0-100（後方互換性、NULL可） |
| created_at | TEXT | 作成日時（ISO 8601形式） |

**座標の使用順**:
1. **緯度経度（latitude/longitude）** - Google Mapsで使用（推奨）
2. XY座標（x_coordinate/y_coordinate） - SVG地図で使用（後方互換性）

### テーブル作成SQL
```sql
CREATE TABLE IF NOT EXISTS map_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  memo TEXT NOT NULL,
  linked_post_id INTEGER,
  latitude REAL,
  longitude REAL,
  x_coordinate REAL,
  y_coordinate REAL,
  created_at TEXT NOT NULL
);
```

### 緯度経度カラム追加SQL（既存テーブルに追加する場合）
```sql
ALTER TABLE map_locations ADD COLUMN latitude REAL;
ALTER TABLE map_locations ADD COLUMN longitude REAL;
```

**実行方法（ローカル）**:
```bash
npx wrangler d1 execute my_blog_db --local --command "CREATE TABLE IF NOT EXISTS map_locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, prefecture TEXT NOT NULL, memo TEXT NOT NULL, linked_post_id INTEGER, created_at TEXT NOT NULL);"
```

**実行方法（リモート）**:
```bash
npx wrangler d1 execute my_blog_db --remote --command "CREATE TABLE IF NOT EXISTS map_locations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, prefecture TEXT NOT NULL, memo TEXT NOT NULL, linked_post_id INTEGER, created_at TEXT NOT NULL);"
```

または、Cloudflareダッシュボードから直接SQL実行。

---

## 7. ルーティング

### 7.1 ナビゲーションリンク
**ファイル**: `src/App.tsx:70-75`

```tsx
<div style={{ display: "flex", gap: "1rem" }}>
  {secondRow.map(cat => (
    <Link key={cat} to={`/category/${cat}`}>{cat}</Link>
  ))}
  <Link to="/map">Map</Link>
  <Link to="/profile">執筆者</Link>
</div>
```

**配置**:
- ヘッダーの2行目（技術、日常の後）
- プロフィールリンクの前

### 7.2 ルート定義
**ファイル**: `src/App.tsx:93-106`

```tsx
<Routes>
  <Route path='/' element={<TitleCard category="すべて" />}/>
  {categories.map(cat=>(
    <Route
      key={cat}
      path={`/category/${cat}`}
      element={<TitleCard category={cat}/>}
    />
  ))}
  <Route path="/post/:id" element={<PostDetailPage />} />
  <Route path='/map' element={<MapPage/>}/>
  <Route path='/profile' element={<Profile/>}/>
</Routes>
```

**URL**: `/map`

---

## 8. 関連ファイル

### フロントエンド
- `src/components/JapanMap.tsx` - 日本地図SVGコンポーネント
- `src/components/MapPage.tsx` - Mapページのメインコンポーネント
- `src/App.tsx` - ルーティング設定

### バックエンド
- `_worker.ts` - Cloudflare Workers（Hono）
  - GET `/api/map-locations` - 地点一覧取得
  - POST `/api/map-locations` - 地点追加
  - DELETE `/api/map-locations/:id` - 地点削除

### データベース
- `my_blog_db` - Cloudflare D1データベース
  - `map_locations` テーブル

---

## 9. カスタム座標機能

### 9.1 概要

各地点のピン位置を正確に指定できる機能です。

**特徴**:
- Google Maps検索ボタンで正確な位置を確認
- X座標（横）とY座標（縦）を0-100の範囲で指定
- 都道府県のデフォルト座標を初期値として表示
- カスタム座標がない場合は自動的にデフォルト座標を使用

### 9.2 Google Maps検索機能

**ファイル**: `src/components/MapPage.tsx:206-213`

```tsx
const handleGoogleMapsSearch = () => {
  const query = searchQuery || `${name} ${prefecture}`;
  if (!query.trim()) {
    alert('検索ワードを入力してください');
    return;
  }
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  window.open(url, '_blank');
};
```

**動作フロー**:
1. 「場所の名前」と「都道府県」を入力
2. 「Google Mapsで検索」ボタンをクリック
3. 新しいタブでGoogle Maps検索結果が開く
4. Google Mapsで場所を右クリック → 座標をコピー
5. 緯度経度を0-100の範囲に変換してX/Y欄に入力

### 9.3 座標の変換方法

Google Mapsの座標（緯度・経度）を地図の座標（0-100）に変換：

**簡易変換方法**:
- 日本地図の範囲: 北海道の北端から沖縄の南端まで
- 手動で微調整しながら確認

**詳細な変換式**（参考）:
```
X座標 = ((経度 - 122) / (148 - 122)) * 100
Y座標 = ((50 - 緯度) / (50 - 24)) * 100
```

### 9.4 フォームUI

**ファイル**: `src/components/MapPage.tsx:250-309`

```tsx
{/* Google Maps検索セクション */}
<div style={{ padding: '1rem', background: '#f0f9ff', ... }}>
  <h3>📍 Google Mapsで座標を確認</h3>
  <input
    placeholder={`例: ${name || '有馬温泉'} ${prefecture}`}
    ...
  />
  <button onClick={handleGoogleMapsSearch}>
    🔍 Google Mapsで検索
  </button>
  <p>ヒント: Google Mapsで場所を右クリック → 座標をコピー → 下に貼り付け</p>
</div>

{/* 座標入力欄 */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
  <input placeholder={`初期値: ${prefectureCoordinates[prefecture]?.x}`} />
  <input placeholder={`初期値: ${prefectureCoordinates[prefecture]?.y}`} />
</div>
```

### 9.5 座標の使用ロジック

**ファイル**: `src/components/JapanMap.tsx:107-120`

```tsx
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
    <div style={{ left: `${x}%`, top: `${y}%`, ... }}>
      {/* ピン */}
    </div>
  );
})}
```

**ポイント**:
- `null`と`undefined`の両方をチェック
- カスタム座標が設定されていない既存データも正常に動作
- 後方互換性を維持

---

## 10. 使用例

### 10.1 基本的な地点の追加
1. Mapページを開く
2. 下部のフォームに入力
   - 場所の名前: "有馬温泉"
   - 都道府県: "兵庫"
   - メモ: "日本三名泉の一つ。金泉が有名。"
   - 関連する投稿ID: 12（オプション）
3. 「地点を追加」ボタンをクリック
4. パスワードを入力
5. 地図上にピンが表示され、右側にカードが追加される

**結果**: 兵庫県のデフォルト座標にピンが配置される

### 10.2 正確な座標で地点を追加（推奨）
1. 「場所の名前」と「都道府県」を入力
2. 「🔍 Google Mapsで検索」ボタンをクリック
3. Google Mapsで正確な場所を確認
4. 地図上で右クリック → 座標をコピー
5. X座標とY座標の欄に値を入力（例: X=48, Y=50）
6. メモなどを入力
7. 「地点を追加」ボタンをクリック

**結果**: 指定した正確な座標にピンが配置される

### 10.3 地点を確認
1. 地図上のピンをクリック
2. 対応するカードが黄色背景で表示される
3. カードが見える位置まで自動スクロール

### 10.4 関連記事へ移動
1. カードの「関連記事を見る →」リンクをクリック
2. 対応する記事の詳細ページへ遷移

---

## 11. 地図表示の切り替え機能

### 11.1 SVG地図とGoogle Mapsの切り替え

座標の精度を確認するため、SVG地図とGoogle Mapsを切り替えて表示できる機能を実装しています。

**ファイル**: `src/components/JapanMap.tsx:73,97-127`

```tsx
const [showGoogleMaps, setShowGoogleMaps] = useState(false);

return (
  <div>
    {/* 切り替えボタン */}
    <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={() => setShowGoogleMaps(false)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: !showGoogleMaps ? '#3b82f6' : '#e5e7eb',
          color: !showGoogleMaps ? 'white' : '#374151',
          fontWeight: !showGoogleMaps ? '600' : 'normal'
        }}
      >
        SVG地図
      </button>
      <button
        onClick={() => setShowGoogleMaps(true)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: showGoogleMaps ? '#3b82f6' : '#e5e7eb',
          color: showGoogleMaps ? 'white' : '#374151',
          fontWeight: showGoogleMaps ? '600' : 'normal'
        }}
      >
        Google Maps（参照用）
      </button>
    </div>

    {!showGoogleMaps ? (
      <>{/* SVG地図とピン */}</>
    ) : (
      <>{/* Google Maps埋め込み */}</>
    )}
  </div>
);
```

**機能**:
- トグルボタンでSVG地図とGoogle Mapsを切り替え
- Google Mapsモードでは日本全体を表示（ズームレベル5）
- 手動でズーム・移動して各地点の正確な位置を確認可能
- 座標のズレを視覚的に確認しやすい

**使用例**:
1. SVG地図で登録した地点のピンを確認
2. 「Google Maps（参照用）」ボタンをクリック
3. Google Mapsで実際の地理位置を確認
4. 必要に応じて緯度経度を調整

### 11.2 Google Mapsマーカー

Google Maps JavaScript APIの標準マーカーを使用しています。

**ファイル**: `src/components/GoogleMapComponent.tsx`

```tsx
const marker = new google.maps.Marker({
  position: { lat: location.latitude!, lng: location.longitude! },
  map: map,
  title: location.name,
  icon: {
    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  },
});
```

**マーカーの種類**:
- **赤色マーカー**: 登録済みの地点（`red-dot.png`）
- **緑色マーカー**: ピン位置設定時の仮マーカー（`green-dot.png`）

**情報ウィンドウ**:
```tsx
const infoWindow = new google.maps.InfoWindow({
  content: `
    <div style="padding: 8px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">${location.name}</h3>
      <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${location.prefecture}</p>
      <p style="margin: 0; font-size: 14px;">${location.memo}</p>
    </div>
  `,
});

marker.addListener('click', () => {
  infoWindow.open(map, marker);
  onLocationClick?.(location);
});
```

**機能**:
- マーカークリックで情報ウィンドウ表示
- 地点名、都道府県、メモを表示
- カード一覧へのスクロール連動

---

## 12. 今後の改善案

### 1. 地図の強化
- より詳細な都道府県の輪郭
- ズーム・パン機能
- 都道府県の境界線を表示
- 地域ごとの色分け

### 2. ピンのカスタマイズ
- カテゴリ別の色分け（温泉=赤、観光地=青など）
- ピンのサイズ変更（訪問回数に応じて）
- カスタムアイコン対応

### 3. フィルタリング機能
- 都道府県で絞り込み
- カテゴリで絞り込み
- 期間で絞り込み

### 4. 統計情報
- 訪問した都道府県の数
- 最も訪問した地域
- 訪問の時系列グラフ

### 5. 画像対応
- 地点ごとに画像を追加
- カードにサムネイル表示
- 画像ギャラリー

### 6. エクスポート機能
- 訪問地点のリストをCSVでエクスポート
- 地図画像としてダウンロード

### 7. ルート機能
- 複数の地点を線で繋ぐ
- 旅行のルートを可視化

---

## 13. トラブルシューティング

### 地点が地図に表示されない
- 都道府県名が正しいか確認（例: "東京都" ではなく "東京"）
- ブラウザのコンソールでエラーを確認
- データベースに正しく保存されているか確認

### ピンの位置がおかしい
- `prefectureCoordinates`の座標値を調整
- SVGのviewBoxとの整合性を確認

### 地点の追加に失敗する
- パスワードが正しいか確認
- 必須項目が全て入力されているか確認
- ネットワークタブでAPIレスポンスを確認

### 関連記事のリンクが動作しない
- `linked_post_id`が正しい記事IDか確認
- 対応する記事が存在するか確認

### 地図のホバー効果が機能しない

**問題**:
- 地図の都道府県にマウスを乗せても色が変わらない

**原因**:
- `<img>`タグでSVGを読み込むと、CSSがSVGの内部要素（`.prefecture`クラス）にアクセスできない

**解決方法**:
SVGをインラインで埋め込むように変更

**変更前**:
```tsx
<img src={mapSrc} alt="日本地図" />
```

**変更後**:
```tsx
const [svgContent, setSvgContent] = useState<string>('');

useEffect(() => {
  const mapSrc = isMobile ? '/map-mobile.svg' : '/map-full.svg';
  fetch(mapSrc)
    .then(res => res.text())
    .then(svg => setSvgContent(svg))
    .catch(err => console.error('Failed to load map:', err));
}, [isMobile]);

return (
  <div dangerouslySetInnerHTML={{ __html: svgContent }} />
);
```

これでCSSの`.prefecture:hover`が正しく動作します。

### ページ全体の幅が狭くなる（横スクロールバーが出る）

**問題**:
- Mapページやカテゴリページで横スクロールバーが表示される
- ヘッダーやコンテンツの幅が画面幅より大きくなる

**原因**:
- `#root`に`padding: 2rem`が設定されている
- `width: 100%` + `padding`で、合計が100%を超える
- `box-sizing: content-box`（デフォルト）のため

**解決方法**:

**ファイル**: `src/index.css:16-22`

**修正前**:
```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
```

**修正後**:
```css
#root {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  box-sizing: border-box; /* パディングを幅に含める */
}
```

**ポイント**:
- `box-sizing: border-box`で、`width`にパディングとボーダーが含まれる
- これにより`width: 100%` = 画面幅全体（パディング込み）

---

### 地図と地点追加フォームが重なる

**問題**:
- sticky地図がスクロール時にフォームの上に被さる
- フォームが見えなくなる

**原因**:
- `.map-container`に`position: sticky`が設定されている
- `.map-container`の`z-index: 1`が、フォームより上
- フォームに`z-index`が設定されていない

**解決方法**:

**ファイル**: `src/components/MapPage.tsx:127-135`

**修正前**:
```tsx
<div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
  <h2>新しい地点を追加</h2>
  <MapLocationForm ... />
</div>
```

**修正後**:
```tsx
<div style={{
  marginTop: '2rem',
  padding: '1rem',
  background: '#f9f9f9',
  borderRadius: '8px',
  position: 'relative',
  zIndex: 100,  /* sticky地図より上 */
  clear: 'both'
}}>
  <h2>新しい地点を追加</h2>
  <MapLocationForm ... />
</div>
```

**CSSファイル**: `src/index.css:167-173`

```css
.map-container {
  position: sticky;
  top: 80px;
  height: fit-content;
  max-height: 80vh;
  min-width: 0;
  z-index: 1; /* フォームより下 */
}
```

**ポイント**:
- フォームの`z-index: 100` > 地図の`z-index: 1`
- `position: relative`でスタッキングコンテキストを作成
- `clear: both`でレイアウトをクリア

---

## 14. 実装中に発生したエラーと解決方法

### エラー1: TypeScript型インポートエラー

**エラーメッセージ**:
```
src/components/MapPage.tsx(3,20): error TS1484: 'MapLocation' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
```

**原因**:
- `verbatimModuleSyntax`が有効な場合、型のインポートは`import type`で行う必要がある

**解決方法**:

**修正前**:
```tsx
import JapanMap, { MapLocation, prefectureCoordinates } from './JapanMap';
```

**修正後**:
```tsx
import JapanMap, { prefectureCoordinates } from './JapanMap';
import type { MapLocation } from './JapanMap';
```

---

### エラー2: fetch()のレスポンス型エラー

**エラーメッセージ**:
```
error TS18046: 'data' is of type 'unknown'.
```

**原因**:
- `res.json()`の戻り値は`unknown`型
- TypeScriptは型を推論できないため、明示的な型アサーションが必要

**解決方法**:

**修正前**:
```tsx
.then(data => {
  if (data.success) {
    setLocations(data.locations);
  }
})
```

**修正後**:
```tsx
.then(data => {
  const response = data as { success: boolean; locations?: MapLocation[] };
  if (response.success && response.locations) {
    setLocations(response.locations);
  }
})
```

**ポイント**:
- `as`キーワードで型アサーション
- オプショナルプロパティ（`?`）で安全性を確保
- 条件分岐で`undefined`チェック

---

### エラー3: ビルド時の型互換性エラー

**エラーメッセージ**:
```
error TS2345: Argument of type '(data: { success: boolean; locations?: MapLocation[]; }) => void' is not assignable to parameter of type '(value: unknown) => void | PromiseLike<void>'.
```

**原因**:
- `.then()`のコールバック関数のパラメータ型を直接指定すると、TypeScriptの型推論と競合

**解決方法**:

**修正前**:
```tsx
.then((data: { success: boolean; locations?: MapLocation[] }) => {
  if (data.success && data.locations) {
    setLocations(data.locations);
  }
})
```

**修正後**:
```tsx
.then(data => {
  const response = data as { success: boolean; locations?: MapLocation[] };
  if (response.success && response.locations) {
    setLocations(response.locations);
  }
})
```

**ポイント**:
- パラメータの型注釈を削除
- 関数内で型アサーション（`as`）を使用

---

## 15. 今後の開発で注意すること

### TypeScriptの型安全性
- APIレスポンスは必ず型を明示する
- `unknown`型は適切に型アサーションする
- 型インポートは`import type`を使用

### SVGの扱い
- CSSでスタイル変更したい場合はインライン埋め込み
- `<img>`タグは単純な表示のみ

### ビルドエラーの確認
- デプロイ前に必ず`npm run build`でローカルビルド確認
- 開発サーバー（`npm run dev`）では見つからないエラーがある

### レイアウトとスタイリング
- `box-sizing: border-box`を使用してパディングを幅に含める
- `z-index`の階層を適切に管理（フォーム > 地図 > 他の要素）
- stickyポジションの要素は、スクロール時の重なりに注意

### カスタム座標機能
- カスタム座標は`NULL`許可
- 既存データとの後方互換性を必ず確保
- 座標の優先順位: カスタム → デフォルト

---

### 緯度経度からX/Y座標への変換が不正確

**問題**:
- Google Mapsから取得した緯度経度を登録したが、地図上で全く違う場所にピンが表示される
- 例: 箱根温泉（神奈川県）の座標を登録したら、宮城県にピンが表示された

**原因**:
- 簡易的な線形変換式が、実際のGeolonia SVG地図の投影と一致していない
- 日本列島全体を覆う範囲で計算すると、地域によって誤差が大きくなる

**解決方法**:
東京と北海道の実際の緯度経度を基準に、変換パラメータを校正する。

**ファイル**: `_worker.ts:288-310`

**修正前**:
```typescript
function convertLatLonToXY(lat: number, lon: number): { x: number, y: number } {
  const LAT_MIN = 30;   // 鹿児島南端
  const LAT_MAX = 45.5; // 北海道北端
  const LON_MIN = 128;  // 九州西端
  const LON_MAX = 146;  // 北海道東端

  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
}
```

**修正後**:
```typescript
function convertLatLonToXY(lat: number, lon: number): { x: number, y: number } {
  // SVG地図の実際の投影に合わせた範囲（校正済み）
  // 基準点:
  // - 東京: 35.6762°N, 139.6503°E → x: 67, y: 47
  // - 北海道: 43.0642°N, 141.3469°E → x: 75, y: 10
  const LAT_MIN = 25.06;
  const LAT_MAX = 45.06;
  const LON_MIN = 125.44;
  const LON_MAX = 146.65;

  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
}
```

**校正方法**:
1. 既知の2地点（東京、北海道）の実座標と期待されるSVG座標を使用
2. 連立方程式を解いて、LAT_MIN/MAX、LON_MIN/MAXを算出

**計算例**（東京と北海道を使用）:
```
東京: lat 35.6762, lon 139.6503 → 期待値 x: 67, y: 47
北海道: lat 43.0642, lon 141.3469 → 期待値 x: 75, y: 10

緯度からY座標への変換:
y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100

北海道: 10 = ((LAT_MAX - 43.0642) / (LAT_MAX - LAT_MIN)) * 100
東京: 47 = ((LAT_MAX - 35.6762) / (LAT_MAX - LAT_MIN)) * 100

これを解くと:
LAT_MAX - LAT_MIN = 20
LAT_MAX = 45.06
LAT_MIN = 25.06

経度からX座標への変換も同様に:
LON_MAX - LON_MIN = 21.21
LON_MIN = 125.44
LON_MAX = 146.65
```

**検証**:
箱根温泉（35.233850°N, 139.09555°E）の場合:
```
y = ((45.06 - 35.233850) / 20) * 100 = 49.13
x = ((139.09555 - 125.44) / 21.21) * 100 = 64.40
```
神奈川県のデフォルト座標（x: 65, y: 48）と近い値になり、正しく表示される。

**デバッグ用の座標表示**:
カードに実際のX/Y座標を表示することで、変換結果を確認できる。

**ファイル**: `src/components/MapPage.tsx:98-102`

```tsx
{(location.x_coordinate !== null && location.y_coordinate !== null) && (
  <p style={{ fontSize: '0.8rem', color: '#999' }}>
    座標: X={location.x_coordinate?.toFixed(2)}, Y={location.y_coordinate?.toFixed(2)}
  </p>
)}
```

**ポイント**:
- 地図の投影方法によって、変換式は異なる
- 複数の基準点を使って校正することで精度が向上する
- 今後さらに精度が必要な場合は、より多くの基準点（大阪、福岡など）を使用する

---

## 16. Google Maps JavaScript APIへの移行

### 16.1 背景

SVG地図での座標変換精度の問題を解決するため、Google Maps JavaScript APIに移行しました。

**課題**:
- SVG地図での緯度経度→XY座標の変換精度が不十分
- 地図の投影方法により、地域によって誤差が発生
- ドラッグ&ドロップでの位置設定でもズレが生じる

**解決策**:
Google Maps JavaScript APIを使用することで、正確な緯度経度でピンを表示できるようになりました。

### 16.2 Google Maps API キーの取得

**手順**:

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/

2. **プロジェクトを作成**
   - プロジェクト名: 例「my-blog-map」

3. **Maps JavaScript APIを有効化**
   - 「APIとサービス」→「ライブラリ」
   - 「Maps JavaScript API」を検索して有効化

4. **APIキーを作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「APIキー」

5. **APIキーに制限を設定（重要）**
   - HTTPリファラー制限:
     ```
     https://vite-project-1kp.pages.dev/*
     http://localhost:*
     ```
   - API制限: 「Maps JavaScript API」のみ選択

6. **課金を有効化**
   - クレジットカード登録が必須
   - 月100,000マップロードまで無料（Essentials tier）

### 16.3 環境変数の設定

**ファイル**: `.env`

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
```

**重要**:
- `.env`ファイルは`.gitignore`に追加済み（公開されない）
- ViteではVITE_プレフィックスが必要
- 本番環境ではCloudflare Pagesの環境変数に設定

**Cloudflare Pages環境変数設定**:
1. Cloudflareダッシュボード → Pages → プロジェクト
2. Settings → Environment variables
3. 変数名: `VITE_GOOGLE_MAPS_API_KEY`
4. 値: APIキー

### 16.4 GoogleMapComponent

新しい地図コンポーネントを作成しました。

**ファイル**: `src/components/GoogleMapComponent.tsx`

```tsx
interface GoogleMapComponentProps {
  locations: MapLocation[];
  onLocationClick?: (location: MapLocation) => void;
  onMapClick?: (lat: number, lng: number) => void;
  clickableForPinPlacement?: boolean;
  height?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  locations,
  onLocationClick,
  onMapClick,
  clickableForPinPlacement = false,
  height = '600px'
}) => {
  // Google Maps APIを動的にロード
  const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps API failed to load'));
      document.head.appendChild(script);
    });
  };

  // 地図を初期化
  const newMap = new google.maps.Map(mapRef.current, {
    center: { lat: 36.2048, lng: 138.2529 }, // 日本の中心
    zoom: 6,
  });

  // マーカーを配置
  const marker = new google.maps.Marker({
    position: { lat: location.latitude!, lng: location.longitude! },
    map: map,
    title: location.name,
  });

  return <div ref={mapRef} style={{ width: '100%', height }} />;
};
```

**機能**:
- Google Maps JavaScript APIを動的にロード
- 複数マーカーの表示
- マーカークリックで情報ウィンドウ
- 自動ズーム調整（全マーカーが表示されるように）
- 地図クリックでピン位置設定（`clickableForPinPlacement`モード）

### 16.5 ピン位置設定モーダル（Google Maps版）

**ファイル**: `src/components/PinLocationModalGoogleMaps.tsx`

```tsx
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

  return (
    <GoogleMapComponent
      locations={[]}
      onMapClick={handleMapClick}
      clickableForPinPlacement={true}
      height="500px"
    />
  );
};
```

**使い方**:
1. 「Google Mapsで位置を設定」ボタンをクリック
2. モーダルでGoogle Mapsが開く
3. 地図上の任意の場所をクリック
4. 緑色のマーカーが配置される
5. 座標が表示される（緯度・経度）
6. 「この位置に決定」で確定

### 16.6 データベーススキーマの更新

緯度経度を直接保存するようにスキーマを更新しました。

**新規カラム**:
```sql
ALTER TABLE map_locations ADD COLUMN latitude REAL;
ALTER TABLE map_locations ADD COLUMN longitude REAL;
```

**更新後のスキーマ**:
```sql
CREATE TABLE map_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  memo TEXT NOT NULL,
  linked_post_id INTEGER,
  latitude REAL,           -- 新規: 緯度
  longitude REAL,          -- 新規: 経度
  x_coordinate REAL,       -- 後方互換性のため保持
  y_coordinate REAL,       -- 後方互換性のため保持
  created_at TEXT NOT NULL
);
```

**マイグレーション実行**:

```bash
# ローカル
npx wrangler d1 execute my_blog_db --local --command "ALTER TABLE map_locations ADD COLUMN latitude REAL; ALTER TABLE map_locations ADD COLUMN longitude REAL;"

# リモート（Cloudflareダッシュボード）
# D1 → my_blog_db → Console で以下を実行:
ALTER TABLE map_locations ADD COLUMN latitude REAL;
ALTER TABLE map_locations ADD COLUMN longitude REAL;
```

### 16.7 バックエンドの更新

**ファイル**: `_worker.ts`

**型定義の更新**:
```typescript
type MapLocation = {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id: number | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  latitude: number | null;      // 新規
  longitude: number | null;     // 新規
  created_at: string;
};
```

**POSTエンドポイントの更新**:
```typescript
app.post('/api/map-locations', async (c) => {
  const latitude = formData.get('latitude') as string | null;
  const longitude = formData.get('longitude') as string | null;

  let lat: number | null = null;
  let lon: number | null = null;

  if (latitude && longitude) {
    lat = parseFloat(latitude);
    lon = parseFloat(longitude);

    // XY座標への変換（後方互換性のため）
    if (!isNaN(lat) && !isNaN(lon)) {
      const converted = convertLatLonToXY(lat, lon);
      xCoord = converted.x;
      yCoord = converted.y;
    }
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO map_locations (name, prefecture, memo, linked_post_id, latitude, longitude, x_coordinate, y_coordinate, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, prefecture, memo, linked_post_id || null, lat, lon, xCoord, yCoord, created_at).run();
});
```

**ポイント**:
- 緯度経度を直接保存
- XY座標は後方互換性のため自動計算して保存
- 既存データとの互換性を維持

### 16.8 フロントエンドの更新

**MapPage.tsx の主な変更**:

```tsx
// SVG地図からGoogle Mapsへ変更
import GoogleMapComponent from './GoogleMapComponent';
import PinLocationModalGoogleMaps from './PinLocationModalGoogleMaps';

const MapPage: React.FC = () => {
  return (
    <div className="map-container">
      <GoogleMapComponent
        locations={locations}
        onLocationClick={handlePinClick}
        height="80vh"
      />
    </div>
  );
};
```

**フォームの変更**:
```tsx
const MapLocationForm: React.FC = () => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const handlePinConfirm = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <form>
      {/* ピン位置設定（必須） */}
      <button onClick={() => setIsModalOpen(true)}>
        🎯 Google Mapsで位置を設定
      </button>

      {latitude && longitude && (
        <p>✓ ピン位置設定済み（緯度: {latitude.toFixed(6)}, 経度: {longitude.toFixed(6)}）</p>
      )}

      <PinLocationModalGoogleMaps
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handlePinConfirm}
      />
    </form>
  );
};
```

### 16.9 料金とコスト管理

**Google Maps Platform料金**:
- **Essentials tier**: 月100,000マップロード無料
- **超過時**: $7/1,000マップロード
- **マーカー**: 追加料金なし（マップロードのみカウント）

**コスト削減のベストプラクティス**:
1. **APIキー制限を設定**（HTTPリファラー）
2. **使用量をモニタリング**（Google Cloud Console）
3. **予算アラートを設定**
4. **キャッシュを活用**（ブラウザキャッシュ）

**無料枠で十分な理由**:
- 個人ブログの訪問者は通常月数千〜数万程度
- 1訪問あたり1マップロード = 10万訪問/月まで無料
- マーカー表示は追加料金なし

### 16.10 利用規約の遵守

**必須要件**:
1. ✅ **APIキーの制限設定**（HTTPリファラー、API制限）
2. ✅ **Googleロゴの表示**（自動表示、削除禁止）
3. ✅ **利用規約への同意**
4. ⚠️ **プライバシーポリシーの掲示**（推奨）

**公式規約**:
- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
- [Maps JavaScript API Policies](https://developers.google.com/maps/documentation/javascript/policies)

### 16.11 トラブルシューティング

#### APIキーが機能しない

**症状**: 地図が表示されず「Google Maps API failed to load」エラー

**解決方法**:
1. APIキーが正しく設定されているか確認
2. Maps JavaScript APIが有効化されているか確認
3. HTTPリファラー制限が正しいか確認
4. ブラウザのコンソールでエラーメッセージを確認

#### マーカーが表示されない

**症状**: 地図は表示されるがマーカーが表示されない

**原因と解決方法**:
- 緯度経度がnullまたはundefined → データベースを確認
- 緯度経度の範囲外 → 日本の範囲内か確認（北緯24-46度、東経122-154度）
- データベースにlatitude/longitudeカラムがない → マイグレーション実行

#### 環境変数が読み込まれない

**症状**: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`がundefined

**解決方法**:
1. `.env`ファイルが正しい場所にあるか確認（プロジェクトルート）
2. 環境変数名が`VITE_`で始まっているか確認
3. 開発サーバーを再起動（`npm run dev`）
4. 本番環境ではCloudflare Pagesの環境変数を設定

---

## 17. 新旧比較

### SVG地図版 vs Google Maps版

| 項目 | SVG地図版 | Google Maps版 |
|------|-----------|---------------|
| **精度** | ±数km〜数十km | 完全正確 |
| **料金** | 完全無料 | 月10万マップロードまで無料 |
| **依存関係** | なし | Google Maps API |
| **オフライン** | 可能 | 不可 |
| **カスタマイズ** | 自由度高 | 制限あり |
| **保守性** | 変換式の調整必要 | Google側で管理 |
| **ユーザー体験** | 見慣れない | Googleマップで親しみやすい |
| **推奨度** | ❌ | ✅ |

### 移行の経緯

1. **SVG地図での課題**
   - 座標変換精度が不十分
   - ドラッグ&ドロップでも位置ズレ
   - 投影法の違いにより地域差が発生

2. **Google Maps採用の決定**
   - 正確な位置表示が必須
   - 無料枠で十分運用可能
   - ユーザーにとって使いやすい

3. **後方互換性の確保**
   - 既存データはx_coordinate/y_coordinateを保持
   - 新規データは緯度経度を優先
   - SVGコンポーネントは削除せず保持

---

**最終更新**: 2026-01-31

# Map機能の解説

## 概要
このドキュメントでは、訪問した場所を日本地図上にピンで表示し、各地点の詳細情報をカード形式で管理する「Map機能」について説明します。

**主な機能**:
- 日本地図上に訪問地点をピンで表示
- 地点の詳細情報（名前、都道府県、メモ）をカード形式で表示
- 既存の記事との関連付け
- ピンとカードの連動（ピンクリック → カードへスクロール）

---

## 1. 全体構成

### 1.1 ページレイアウト
**ファイル**: `src/components/MapPage.tsx:58-96`

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '1rem',
}}>
  {/* 左側: 日本地図（sticky） */}
  <div style={{
    position: 'sticky',
    top: '80px',
    height: 'fit-content',
    maxHeight: '80vh'
  }}>
    <JapanMap locations={locations} onPinClick={handlePinClick} />
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
- 左側の地図は`position: sticky`で固定表示
- 右側のカード一覧は独立してスクロール可能
- グリッドレイアウト（2:1の比率）で画面を分割

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
| created_at | TEXT | 作成日時（ISO 8601形式） |

### テーブル作成SQL
```sql
CREATE TABLE IF NOT EXISTS map_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  memo TEXT NOT NULL,
  linked_post_id INTEGER,
  created_at TEXT NOT NULL
);
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

## 9. 使用例

### 9.1 地点を追加
1. Mapページを開く
2. 下部のフォームに入力
   - 場所の名前: "有馬温泉"
   - 都道府県: "兵庫"
   - メモ: "日本三名泉の一つ。金泉が有名。"
   - 関連する投稿ID: 12（オプション）
   - パスワード: 設定したパスワード
3. 「地点を追加」ボタンをクリック
4. 地図上にピンが表示され、右側にカードが追加される

### 9.2 地点を確認
1. 地図上のピンをクリック
2. 対応するカードが黄色背景で表示される
3. カードが見える位置まで自動スクロール

### 9.3 関連記事へ移動
1. カードの「関連記事を見る →」リンクをクリック
2. 対応する記事の詳細ページへ遷移

---

## 10. 今後の改善案

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

## 11. トラブルシューティング

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

---

**最終更新**: 2026-01-25

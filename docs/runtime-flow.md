# 実行時フロー詳細ドキュメント

作成日: 2026-04-12
対象: Cloudflare Pages にデプロイ済みの本番環境

---

## 目次

1. [インフラ構成の全体像](#インフラ構成の全体像)
2. [ドメインアクセスから初期表示までの流れ](#ドメインアクセスから初期表示までの流れ)
3. [利用シナリオ別の動作フロー](#利用シナリオ別の動作フロー)
   - [記事一覧の閲覧](#シナリオ1-記事一覧の閲覧)
   - [カテゴリ別閲覧](#シナリオ2-カテゴリ別閲覧)
   - [記事詳細の閲覧](#シナリオ3-記事詳細の閲覧)
   - [スクロール時のスティッキーヘッダー](#シナリオ4-スクロール時のスティッキーヘッダー)
   - [記事の投稿（テキストのみ）](#シナリオ5-記事の投稿テキストのみ)
   - [記事の投稿（アイキャッチ画像あり）](#シナリオ6-記事の投稿アイキャッチ画像あり)
   - [スラッシュコマンドで記事内に画像を挿入](#シナリオ7-スラッシュコマンドで記事内に画像を挿入)
   - [スラッシュコマンドでコードブロックを挿入](#シナリオ8-スラッシュコマンドでコードブロックを挿入)
   - [記事の削除](#シナリオ9-記事の削除)
   - [プロフィールページの閲覧](#シナリオ10-プロフィールページの閲覧)
   - [Mapページの閲覧](#シナリオ11-mapページの閲覧)
   - [地点の追加](#シナリオ12-地点の追加)
   - [地点の削除](#シナリオ13-地点の削除)

---

## インフラ構成の全体像

```
ユーザーのブラウザ
        ↓ HTTPS リクエスト
Cloudflare エッジネットワーク（CDN）
        ↓
Cloudflare Pages（dist/ フォルダのホスティング）
        ↓ 全リクエストのインターセプト
_worker.js（_worker.ts をビルドしたもの）= Hono アプリ
        ├── /api/* → D1（SQLite DB）または R2（オブジェクトストレージ）にアクセス
        └── それ以外 → dist/ の静的ファイルを返す（React アプリ）

使用サービス:
  - Cloudflare Pages : HTML/CSS/JS のホスティング
  - Cloudflare Workers（Pages Functions）: _worker.js の実行環境
  - Cloudflare D1 : SQLite データベース（posts テーブル、map_locations テーブル）
  - Cloudflare R2 : 画像ファイルのオブジェクトストレージ
```

---

## ドメインアクセスから初期表示までの流れ

ユーザーがブラウザに URL を入力して Enter を押した瞬間から、画面が表示されるまでの詳細なフローを追う。

---

### Step 1: DNS 解決

```
ブラウザ → DNS サーバー → Cloudflare のエッジ IP を返す
```

- ブラウザがドメイン名（例: `xxx.pages.dev`）を DNS に問い合わせる
- Cloudflare の CDN エッジノードの IP アドレスが返される

---

### Step 2: Cloudflare エッジでリクエストを受信

```
GET / HTTP/2
Host: xxx.pages.dev
```

- Cloudflare のエッジが `GET /` のリクエストを受け取る
- `_worker.js` が起動される（Cloudflare Workers ランタイム上）

---

### Step 3: _worker.js（Hono アプリ）によるルーティング

`_worker.ts` の Hono アプリがリクエストを評価する:

```
app.post('/api/post', ...)       → 不一致
app.get('/api/post', ...)        → 不一致
app.get('/api/post/:id', ...)    → 不一致
app.delete('/api/post/:id', ...) → 不一致
app.post('/api/upload-image', .) → 不一致
app.get('/api/map-locations', .) → 不一致
app.post('/api/map-locations', .)→ 不一致
app.delete('/api/map-locations/:id', ...) → 不一致
app.get('*', serveStatic())      → ✅ 一致
```

- `serveStatic()` ミドルウェアが `dist/index.html` を読み込んで返す

---

### Step 4: ブラウザが index.html を受け取る

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/iiicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>個人ブログ</title>
    <meta name="google-site-verification" content="..." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" ...></script>
  </body>
</html>
```

ブラウザはこの HTML をパースし始める:
- `<link rel="icon">` → ファビコン `/iiicon.png` を非同期で取得
- `<meta name="google-site-verification">` → Google Search Console 用（表示には影響なし）
- `<div id="root">` → React がマウントするコンテナを DOM に作成（この時点では空）
- `<script type="module" src="/src/main.tsx">` → JS ファイルを要求
- Cloudflare Web Analytics の `<script defer>` → 非同期で読み込み（表示には影響なし）

---

### Step 5: JavaScript バンドルの取得と実行

```
ブラウザ → GET /assets/index-[hash].js （Vite ビルド成果物）
         → GET /assets/index-[hash].css
Cloudflare → serveStatic() で dist/assets/ から返す
```

- Vite がビルド時に `src/main.tsx` と全依存を1つ（または複数）のバンドルにまとめている
- ブラウザがバンドルをダウンロード・パース・実行

---

### Step 6: main.tsx の実行

```ts
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

1. `document.getElementById('root')` で `<div id="root">` を取得
2. `createRoot()` で React 18 のルートを作成
3. `render()` で React ツリーの構築を開始

**React StrictMode について:**
開発ビルドでは副作用を二重実行するが、本番ビルド（Cloudflare デプロイ）では通常の1回実行のみ。

---

### Step 7: App コンポーネントのレンダリング開始

`App.tsx` が実行される:

1. **初期 state の設定**:
   - `isSticky = false`

2. **ref の初期化**:
   - `mainHeaderRef = null`（まだ DOM にアタッチされていない）
   - `postFormRef = null`

3. **定数の計算**:
   - `categories = ["温泉","料理","ねこ","技術","日常"]`
   - `firstRow = ["温泉","料理","ねこ"]`
   - `secondRow = ["技術","日常"]`

4. **JSX を返す（仮想 DOM の構築）**:
   ```
   <div>
     <header className="site-header" ref={mainHeaderRef}>  ← 通常ヘッダー
       <h1>My Blog</h1>
       <nav>
         <Link to="/">ホーム</Link>
         <Link to="/category/温泉">温泉</Link>
         <Link to="/category/料理">料理</Link>
         <Link to="/category/ねこ">ねこ</Link>
         <Link to="/category/技術">技術</Link>
         <Link to="/category/日常">日常</Link>
         <Link to="/map">Map</Link>
         <Link to="/profile">執筆者</Link>
       </nav>
     </header>

     {false && <header className="sticky-header">...</header>}  ← 非表示

     <main>
       <Routes>
         ← 現在 URL が "/" なので TitleCard category="すべて" がレンダリングされる
         <TitleCard category="すべて" />
       </Routes>
       <div ref={postFormRef}>
         <PostForm />
       </div>
     </main>
   </div>
   ```

---

### Step 8: TitleCard のレンダリングと API 呼び出し

`TitleCard` コンポーネントが実行される（`category="すべて"` で）:

1. **初期 state**: `posts = []`

2. **初回レンダリング（posts が空の状態）**:
   ```
   <div>
     <h1>すべての記事一覧</h1>
     <p>このカテゴリの記事はまだありません。</p>  ← posts が空なので
   </div>
   ```
   この状態が一瞬画面に表示される。

3. **useEffect が実行**（DOM への反映後）:
   ```ts
   fetch('/api/post')
     .then(res => res.json())
     .then(data => setPosts(data.posts))
   ```
   `fetch('/api/post')` が発火 → ネットワークリクエストが始まる

---

### Step 9: PostForm のレンダリング

`PostForm` コンポーネントが実行される:

1. 全 state が初期値で初期化
2. `contentRef.current = ""` に設定
3. `commands` 配列（/image, /code, /link）が定義される
4. フォームの JSX が返される（入力フィールド群）

---

### Step 10: App の useEffect（スクロール監視）が起動

`App.tsx` の `useEffect`:
```ts
window.addEventListener("scroll", handleScroll)
```
- スクロールイベントリスナーが登録される

`mainHeaderRef.current` にヘッダー要素がアタッチされる。

---

### Step 11: /api/post への API リクエストが Cloudflare Workers で処理される

```
ブラウザ → GET /api/post
Workers → app.get('/api/post', ...) にマッチ
```

Worker の処理:
1. `c.req.query('category')` → undefined（クエリなし）
2. クエリ分岐: category なし → `SELECT * FROM posts ORDER BY created_at DESC`
3. D1 データベースにクエリ実行
4. 結果を `{ success: true, posts: [...] }` として JSON で返す

---

### Step 12: TitleCard が API レスポンスを受け取り再レンダリング

```ts
setPosts(data.posts)  // ← posts に記事データが入る
```

React が再レンダリングを実行:

```
filteredPosts = posts（"すべて" なので全件）

→ 記事カードが一覧表示される:
  - 作成日時
  - 記事ID
  - タイトル
  - アイキャッチ画像（image_url があれば）
  - 本文の最初50文字
  - 「続きを読む」リンク
  - 「削除」ボタン
```

---

### 初期表示完了

ユーザーの画面に以下が表示されている:
- 上部: ナビゲーションヘッダー（ホーム・各カテゴリ・Map・執筆者）
- 中央: 記事カード一覧（全カテゴリ、新着順）
- 下部: 投稿フォーム（タイトル・カテゴリ・アイキャッチ画像・本文・パスワード・投稿ボタン）

---

## 利用シナリオ別の動作フロー

---

## シナリオ1: 記事一覧の閲覧

### 概要
ホームページ（`/`）を表示する。初期表示フローと同じ。

### ポイント
- `TitleCard category="すべて"` → `filteredPosts = posts`（フィルタなし）
- 全記事が `created_at DESC`（新着順）で表示される
- 各カードに `post.content.slice(0, 50)` で本文プレビュー（50文字）が表示される
- `post.image_url` が存在する場合のみアイキャッチ画像を表示

---

## シナリオ2: カテゴリ別閲覧

### ユーザー操作
ヘッダーの「温泉」リンクをクリック

### フロー

1. `<Link to="/category/温泉">` → React Router が URL を `/category/温泉` に変更（ページ遷移なし、History API）

2. `Routes` が再評価される:
   ```
   <Route path="/category/温泉" element={<TitleCard category="温泉" />} />
   ```
   → `TitleCard` が `category="温泉"` で再マウント

3. `TitleCard` のマウント時に `useEffect` が再実行:
   ```ts
   fetch('/api/post')  // ← 全記事を取得（カテゴリフィルタはフロントで実施）
   ```

4. レスポンス受信後、`filteredPosts` の計算:
   ```ts
   filteredPosts = posts.filter(post => post.category === "温泉")
   ```

5. 温泉カテゴリの記事のみが表示される

**注意**: フィルタリングはサーバー側ではなく**フロントエンド側**で実施している。`/api/post` は常に全件を取得する。

---

## シナリオ3: 記事詳細の閲覧

### ユーザー操作
記事カードの「続きを読む」リンクをクリック

### フロー

1. `<Link to="/post/42">` → URL が `/post/42` に変更

2. `Routes` が `<PostDetailPage />` をレンダリング

3. **PostDetailPage のマウント**:
   - `useParams()` → `id = "42"`
   - 初期 state: `post = null`, `loading = true`, `error = null`
   - 初回レンダリング: `<div>ローディング中...</div>`（loading が true なので）

4. **useEffect 発火**（`id` が変わるたびに実行）:
   ```ts
   fetch('/api/post/42')
   ```

5. **Worker 処理** (`GET /api/post/:id`):
   ```sql
   SELECT * FROM posts WHERE id = 42
   ```
   - 見つかれば `{ success: true, post: {...} }` を返す
   - 見つからなければ `{ success: false, error: 'Post not found' }` と 404

6. **成功時のフロント処理**:
   - `setPost(data.post)`
   - `setLoading(false)`

7. **再レンダリング**（loading = false, post あり）:
   - `←記事一覧に戻る` リンク（`navigate(-1)` で履歴を戻る）
   - タイトル（h1）
   - カテゴリリンク + 作成日時
   - アイキャッチ画像（`post.image_url` があれば）
   - **ReactMarkdown によるレンダリング**:
     - `remarkBreaks` により改行が `<br>` に変換される
     - ```` ```js ... ``` ```` → `SyntaxHighlighter` でコードをハイライト
     - `![alt](url)` → `<img className="article-image">` で中央寄せ表示

8. **ネットワークエラー時**:
   - catch ブロックで `setError("記事の読み込みに失敗しました。")`
   - `<div className="text-red-500">記事の読み込みに失敗しました。</div>` が表示

---

## シナリオ4: スクロール時のスティッキーヘッダー

### フロー

1. ユーザーがページを下にスクロール

2. `window.scroll` イベントが発火 → `handleScroll()` が実行:
   ```ts
   if (window.scrollY > mainHeaderRef.current.offsetHeight) {
     setIsSticky(true)  // ヘッダーの高さ以上スクロール → sticky 表示
   } else {
     setIsSticky(false)
   }
   ```

3. `isSticky === true` になると `{isSticky && <header className="sticky-header">}` が表示:
   - `animation: fadeInDown 0.3s` で上からスライドインする
   - 「プロフィール」リンク
   - 「投稿」ボタン → `scrollToPostForm()` → `postFormRef.current.scrollIntoView({ behavior: "smooth" })`
   - 「トップ」ボタン → `scrollToTop()` → `window.scrollTo({ top: 0, behavior: 'smooth' })`

4. ページ最上部に戻ると `setIsSticky(false)` → スティッキーヘッダーが消える

---

## シナリオ5: 記事の投稿（テキストのみ）

### ユーザー操作
投稿フォームにタイトル・カテゴリ・本文・パスワードを入力して「投稿」ボタンを押す

### フロー

1. **フォーム入力**:
   - タイトル input → `setTitle(value)`（最大30文字）
   - カテゴリ select → `setCategory(value)`
   - 本文 textarea → `handleContentChange(e)` が呼ばれ `setContent(value)`

2. **「投稿」ボタンクリック** → `handleSubmit(e)` 発火:
   ```ts
   e.preventDefault()  // ページリロードを防止
   ```

3. **FormData の構築**:
   ```ts
   formData.append('title', title)
   formData.append('category', category)
   formData.append('content', content)
   formData.append('password', password)
   // imageFile が null なので image フィールドは追加しない
   ```

4. **API リクエスト**:
   ```
   POST /api/post
   Content-Type: multipart/form-data
   ```

5. **Worker 処理** (`POST /api/post`):
   1. `formData.get('password')` → `c.env.SECRET_KEY` と比較
      - 不一致 → 401 Unauthorized（フロントに返る → `res.ok` が false → `alert("エラー:Unauthorized")`）
   2. `formData.get('image')` → null（画像なし）→ `image_url = null`
   3. バリデーション:
      - `title.length > 30` → 400
      - `!title || !content || !category` → 400
   4. `created_at = new Date().toISOString()` → サーバー側でタイムスタンプ生成
   5. D1 に INSERT:
      ```sql
      INSERT INTO posts (title, category, image_url, content, created_at)
      VALUES ('タイトル', 'ねこ', null, '本文...', '2026-04-12T...')
      ```
   6. `result.meta.last_row_id` → 新しい記事の ID（例: 43）
   7. `SELECT * FROM posts WHERE id = 43` で挿入した記事を取得
   8. `201 Created` で `{ success: true, post: {...} }` を返す

6. **フロントの後処理** (`res.ok === true`):
   ```ts
   alert("投稿が保存されました!")
   window.location.reload()  // ページ全体をリロード
   ```

7. リロード後、再び初期表示フローが走り、新しい記事が一覧に表示される

---

## シナリオ6: 記事の投稿（アイキャッチ画像あり）

### ユーザー操作
「アイキャッチ画像（任意）」の file input でファイルを選択してから投稿する

### フロー

1. **アイキャッチ画像の選択**:
   ```ts
   // アイキャッチ input の onChange
   if (e.target.files && e.target.files[0]) {
     setImageFile(e.target.files[0])  // File オブジェクトを state に保存
   }
   ```
   → `imageFile` state に File オブジェクトが入る（この時点ではまだアップロードしない）

2. **「投稿」ボタンクリック** → `handleSubmit(e)`:
   ```ts
   formData.append('image', imageFile)  // imageFile が null でないので追加される
   ```

3. **Worker 処理** (`POST /api/post`):
   1. パスワード照合（同上）
   2. `formData.get('image')` → File オブジェクトを取得
   3. `imageFile instanceof File && imageFile.size > 0` → true
   4. `imageFile.arrayBuffer()` → バイナリデータ取得
   5. `fileName = '${Date.now()}-${imageFile.name}'` → 例: `1744444444444-cat.jpg`
   6. `c.env.IMAGE_BUCKET.put(fileName, imageBuffer)` → **R2 にアップロード**
   7. `image_url = '${c.env.R2_PUBLIC_URL}/1744444444444-cat.jpg'` → 公開 URL を生成
   8. D1 に INSERT（`image_url` が入る）
   9. 201 で返す

4. 以降はテキストのみの場合と同じ

---

## シナリオ7: スラッシュコマンドで記事内に画像を挿入

### ユーザー操作
本文テキストエリア内で `/image` と入力し、コマンドを選択して画像ファイルを選ぶ

### フロー（詳細）

#### 7-1. `/` を入力した瞬間

```
textarea の onChange → handleContentChange(e)
  newContent = ".../"
  cursorPos = cursorの位置
  textBeforeCursor = ".../"
  lastSlashIndex = 最後の "/" の位置
  textAfterSlash = "/"
  /\s/.test("/") → false（スペースなし）
  → setCommandSearch("/")
  → setShowCommands(true)
  → setSelectedCommandIndex(0)
```

コマンドポップアップが出現:
```
コマンド候補
┌─────────────────────────────┐
│ 📷 /image                   │  ← 選択中（青背景）
│     画像ファイルを選択してアップロード │
│ 💻 /code                    │
│     コードブロックを挿入      │
│ 🔗 /link                    │
│     リンクを挿入              │
└─────────────────────────────┘
↑↓: 選択 | Enter: 実行 | Esc: キャンセル
```

#### 7-2. さらに `i`, `m`, `a`, `g`, `e` と入力するか、そのままEnter/クリック

- `i` 入力 → `commandSearch = "/i"` → `filteredCommands = [/image]`（`/code`, `/link` は除外）
- Enter または 📷ボタンをクリック → `executeCommand(commands[0])` が呼ばれる

#### 7-3. executeCommand 実行

```ts
executeCommand(command) {
  // 1. テキストエリアの "/image"（または "/"）をコンテンツから削除
  cursorPos = textarea.selectionStart  // カーソル位置
  textBeforeCursor = content.substring(0, cursorPos)
  lastSlashIndex = textBeforeCursor.lastIndexOf('/')
  newContent = content.substring(0, lastSlashIndex) + content.substring(cursorPos)
  setContent(newContent)  // "/image" が消えた内容をセット

  // 2. カーソル位置を調整（setTimeout で非同期に）
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = lastSlashIndex
    // ※ textarea.focus() は呼ばない（ファイルダイアログと競合するため）
  }, 0)

  // 3. コマンドポップアップを閉じる
  setShowCommands(false)
  setCommandSearch("")

  // 4. コマンドのアクションを同期的に実行
  command.action()  // = handleInsertImage()
}
```

#### 7-4. handleInsertImage 実行

```ts
hiddenImageInputRef.current?.click()
```

- React が管理する非表示の `<input type="file" className="hidden">` をプログラム的にクリック
- **ブラウザのファイル選択ダイアログが開く**
- ユーザーが画像ファイルを選択するまで待機

#### 7-5. ユーザーがファイルを選択

`hiddenImageInputRef` の input の `onChange` が発火 → `handleContentImageSelect(e)`:

```ts
if (e.target.files && e.target.files[0]) {
  const file = e.target.files[0]  // 選択されたファイル
  try {
    // アップロード開始
    const imageUrl = await uploadImageForContent(file)
    // マークダウン形式で挿入
    const markdown = `![${file.name}](${imageUrl})`
    insertTextAtCursor(markdown)
  } catch (err) {
    alert('画像のアップロードに失敗しました: ' + err.message)
  }
  e.target.value = ''  // inputをリセット（同じファイルを再選択できるよう）
}
```

#### 7-6. uploadImageForContent 実行

```ts
const formData = new FormData()
formData.append('image', file)
const res = await fetch("/api/upload-image", { method: "POST", body: formData })
```

**API リクエスト**: `POST /api/upload-image`

**Worker 処理**:
1. `formData.get('image')` → File オブジェクト取得
2. `imageFile.size === 0` チェック → 問題なし
3. `imageFile.arrayBuffer()` → バイナリ取得
4. `fileName = '${Date.now()}-${file.name}'`
5. `c.env.IMAGE_BUCKET.put(fileName, imageBuffer)` → **R2 にアップロード**
6. `image_url = '${c.env.R2_PUBLIC_URL}/${fileName}'`
7. `{ success: true, image_url: "https://...r2.dev/1744444444444-photo.jpg" }` を返す

#### 7-7. insertTextAtCursor 実行

```ts
const textarea = contentInputRef.current
const start = textarea.selectionStart  // "/image" 削除後のカーソル位置
const end = textarea.selectionEnd
const latest = contentRef.current  // ← stale closure を避けるため ref から最新値を読む
const newContent = latest.substring(0, start)
  + "![photo.jpg](https://...r2.dev/1744444444444-photo.jpg)"
  + latest.substring(end)
setContent(newContent)
contentRef.current = newContent

setTimeout(() => {
  textarea.selectionStart = textarea.selectionEnd = start + markdown.length
  textarea.focus()  // テキストエリアにフォーカスを戻す
}, 0)
```

#### 7-8. 結果

本文テキストエリアに以下が挿入される:
```markdown
（前の文章）![photo.jpg](https://xxx.r2.dev/1744444444444-photo.jpg)（後の文章）
```

記事を投稿すると、`PostDetailPage` の `ReactMarkdown` がこのマークダウンを `<img>` タグに変換して画像が表示される。

---

## シナリオ8: スラッシュコマンドでコードブロックを挿入

### ユーザー操作
`/code` と入力してコマンドを選択

### フロー

7-1〜7-3 と同様（`commandSearch = "/code"` の場合、`/image` と `/link` は除外される）

`executeCommand` で `command.action()`:
```ts
() => insertTextAtCursor('\n```\n\n```\n')
```

→ `insertTextAtCursor('\n```\n\n```\n')` が直接実行される（API 呼び出しなし）

テキストエリアに以下が挿入される:
```
（前の文章）
```
（ここにコードを入力）
```
（後の文章）
```

カーソルは ` ``` ` の間（空行）に移動するので、すぐにコードを入力できる。

---

## シナリオ9: 記事の削除

### ユーザー操作
記事カードの「削除」ボタンをクリック

### フロー

1. **確認ダイアログ**:
   ```ts
   if (!window.confirm("この記事を本当に削除しますか？")) return
   ```
   - 「キャンセル」→ 処理終了

2. **パスワード入力**:
   ```ts
   const password = window.prompt("削除するにはパスワードを入力してください：")
   if (password === null || password === "") return
   ```
   - null（✕ボタン）or 空文字 → 処理終了

3. **API リクエスト**:
   ```
   DELETE /api/post/42
   X-Auth-Password: 入力したパスワード
   ```

4. **Worker 処理** (`DELETE /api/post/:id`):
   1. `c.req.header('X-Auth-Password')` → パスワード照合
      - 不一致 → 401（フロントで `alert("記事の削除に失敗しました。")`）
   2. `DELETE FROM posts WHERE id = 42`
   3. `result.meta.changes > 0` → 成功（1件削除）
   4. `changes === 0` → 404（そのIDは存在しない）

5. **成功時のフロント処理**:
   ```ts
   alert("記事を削除しました。")
   setPosts(posts.filter(post => post.id !== 42))
   ```
   → **ページリロードなし**でリアルタイムに記事カードが消える

---

## シナリオ10: プロフィールページの閲覧

### ユーザー操作
ヘッダーの「執筆者」リンクをクリック

### フロー

1. `<Link to="/profile">` → URL が `/profile` に変更
2. `Routes` が `<Profile />` をレンダリング
3. `Profile` は純粋な静的コンポーネント（API なし）:
   - 年齢・職業・趣味・アルバイト・GitHub リンクを表示
4. 下部には引き続き `PostForm` が表示される

---

## シナリオ11: Mapページの閲覧

### ユーザー操作
ヘッダーの「Map」リンクをクリック

### フロー

1. `<Link to="/map">` → URL が `/map` に変更

2. `Routes` が `<MapPage />` をレンダリング

3. **MapPage のマウント**:
   - `locations = []`, `selectedLocation = null`

4. **useEffect 発火**:
   ```ts
   fetch('/api/map-locations')
   ```

5. **Worker 処理** (`GET /api/map-locations`):
   ```sql
   SELECT * FROM map_locations ORDER BY created_at DESC
   ```
   → `{ success: true, locations: [...] }` を返す

6. **フロント処理**:
   ```ts
   const sortedLocations = locations.sort((a, b) =>
     new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
   )
   // ← Worker は DESC で返すが、フロントで ASC に再ソートしている
   setLocations(sortedLocations)
   ```

7. **再レンダリング**:
   - 左側: `<GoogleMapComponent>` → Google Maps API のロードが開始される
   - 右側: 地点カード一覧

8. **GoogleMapComponent の初期化**:
   - **useEffect 1**: `loadGoogleMapsScript(apiKey)` 実行
     - `window.google` が未定義 → `<script src="https://maps.googleapis.com/maps/api/js?key=...">` を `document.head` に追加
     - スクリプトロード完了 → `setIsLoaded(true)`
   - **useEffect 2**: `isLoaded = true` になると地図を初期化
     - `new google.maps.Map(mapRef.current, { center: 日本中心, zoom: 6 })`
     - `clickableForPinPlacement = false`（MapPage 側）なので、クリックイベントは登録しない
     - `setMap(newMap)`
   - **useEffect 3**: `map` が設定されるとマーカーを配置
     - `locations` の中から `latitude && longitude` があるものだけ抽出
     - 各地点に赤マーカーを配置
     - マーカークリック → 情報ウィンドウ（name, prefecture, memo）を表示 + `handlePinClick(location)` を呼ぶ

9. **地図マーカークリック時** (`handlePinClick`):
   ```ts
   setSelectedLocation(location)
   document.getElementById('location-card-${location.id}')
     .scrollIntoView({ behavior: 'smooth', block: 'nearest' })
   ```
   → 右側の対応するカードが黄色（`#fff3cd`）にハイライトされ、スクロールされる

10. **地点カードの表示内容**:
    - No. （インデックス + 1）
    - 地名 + 都道府県
    - 座標（緯度・経度 6桁）
    - メモ
    - 関連記事リンク（`linked_post_ids` があれば複数、`linked_post_id` があれば1つ）
    - 作成日時（`ja-JP` ロケール）
    - 削除ボタン

---

## シナリオ12: 地点の追加

### ユーザー操作
MapPage 下部の「新しい地点を追加」フォームで入力して送信

### フロー

1. **フォーム入力**:
   - 「場所の名前」 → `setName(value)`
   - 「都道府県」セレクト → `setPrefecture(value)`
   - 「メモ」 → `setMemo(value)`
   - 「関連する投稿ID」（任意）→ `setLinkedPostIds(value)`（カンマ区切り）

2. **ピン位置の設定**（必須）:
   - 「🎯 Google Mapsで位置を設定」ボタンをクリック → `setIsModalOpen(true)`
   - **PinLocationModalGoogleMaps** が表示:
     - 背景オーバーレイ（クリックで閉じる）
     - Google Maps が表示される（`clickableForPinPlacement = true`）
     - ユーザーが地図をクリック:
       ```ts
       // GoogleMapComponent の useEffect 2 内のクリックリスナー
       newMap.addListener('click', (e) => {
         lat = e.latLng.lat()
         lng = e.latLng.lng()
         onMapClick(lat, lng)  // → PinLocationModal の handleMapClick へ
         // 既存の仮マーカーを除去して新しい緑マーカーを配置
       })
       ```
     - `handleMapClick(lat, lng)` → `setSelectedLat(lat)`, `setSelectedLng(lng)`
     - 座標が即座に表示される: `緯度 35.123456, 経度 139.123456`
     - 「この位置に決定」ボタン → `handleConfirm()`:
       ```ts
       onConfirm(selectedLat, selectedLng)  // → MapLocationForm の handlePinConfirm へ
       onClose()  // モーダルを閉じる
       ```
     - `handlePinConfirm(lat, lng)` → `setLatitude(lat)`, `setLongitude(lng)`
   - フォームに「✓ ピン位置設定済み（緯度: ..., 経度: ...）」が表示される

3. **「地点を追加」ボタンをクリック** → `handleSubmit(e)`:
   1. `!name || !prefecture || !memo` → alert でバリデーション
   2. `window.prompt(...)` → パスワード入力
   3. `!latitude || !longitude` → alert（ピン未設定の場合）
   4. `FormData` 構築:
      ```ts
      formData.append('name', name)
      formData.append('prefecture', prefecture)
      formData.append('memo', memo)
      formData.append('password', password)
      formData.append('latitude', latitude.toString())
      formData.append('longitude', longitude.toString())
      // linkedPostIds が入力されている場合:
      const idsArray = linkedPostIds.split(',').map(id => id.trim()).filter(id => id)
      formData.append('linked_post_ids', JSON.stringify(idsArray))  // 例: '["12","15"]'
      ```

4. **API リクエスト**: `POST /api/map-locations`

5. **Worker 処理** (`POST /api/map-locations`):
   1. パスワード照合
   2. 各フィールドを取得
   3. バリデーション（name, prefecture, memo の必須チェック）
   4. 座標処理:
      - `latitude`, `longitude` が提供されている（新形式）
      - `lat = parseFloat(latitude)`, `lon = parseFloat(longitude)`
      - `convertLatLonToXY(lat, lon)` → SVG 地図用の XY 座標も計算（後方互換）
   5. D1 に INSERT:
      ```sql
      INSERT INTO map_locations
        (name, prefecture, memo, linked_post_id, linked_post_ids,
         latitude, longitude, x_coordinate, y_coordinate, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ```
   6. 挿入した地点を SELECT して返す

6. **フロント後処理**:
   ```ts
   alert("地点を追加しました！")
   onSubmit(data.location)  // → setLocations([...locations, newLocation])
   // フォームリセット
   setName(''), setPrefecture('東京'), setMemo(''), setLinkedPostIds('')
   setLatitude(null), setLongitude(null)
   ```
   → **ページリロードなし**で地点カードが追加され、地図に新しいマーカーが表示される

---

## シナリオ13: 地点の削除

### ユーザー操作
地点カードの「削除」ボタンをクリック

### フロー

1. `window.confirm(...)` → キャンセルで終了
2. `window.prompt(...)` → パスワード入力
3. **API リクエスト**: `DELETE /api/map-locations/${locationId}`（`X-Auth-Password` ヘッダー付き）
4. **Worker 処理**:
   - パスワード照合
   - `DELETE FROM map_locations WHERE id = ?`
   - 成功 or 404
5. **成功時のフロント処理**:
   ```ts
   setLocations(locations.filter(loc => loc.id !== locationId))
   if (selectedLocation?.id === locationId) {
     setSelectedLocation(null)  // 選択状態もクリア
   }
   ```
   → Google Maps のマーカーも自動的に消える（`locations` の変化で `useEffect 3` が再実行されるため）

---

*以上、ドメインアクセスから各利用シナリオまでの詳細フロー。*

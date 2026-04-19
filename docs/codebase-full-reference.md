# プロジェクト全ファイル詳細リファレンス

作成日: 2026-04-12
対象: vite-project（個人ブログ）

---

## 目次

1. [index.html](#indexhtml)
2. [src/main.tsx](#srcmaintsx)
3. [src/App.tsx](#srcapptsx)
4. [src/index.css](#srcindexcss)
5. [src/App.css](#srcappcss)
6. [src/vite-env.d.ts](#srcvite-envdts)
7. [src/category/title_card.tsx](#srccategorytitle_cardtsx)
8. [src/components/PostDetailPage.tsx](#srccomponentspostdetailpagetsx)
9. [src/components/PostForm.tsx](#srccomponentspostformtsx)
10. [src/components/profile.tsx](#srccomponentsprofiletsx)
11. [src/components/MapPage.tsx](#srccomponentsmappagetsx)
12. [src/components/GoogleMapComponent.tsx](#srccomponentsgooglemapcomponenttsx)
13. [src/components/PinLocationModalGoogleMaps.tsx](#srccomponentspinlocationmodalgooglemapstsx)
14. [_worker.ts](#_workerts)
15. [vite.config.ts](#viteconfigts)
16. [wrangler.toml](#wranglertoml)
17. [package.json](#packagejson)
18. [migrations/0001_init.sql](#migrations0001_initsql)
19. [calibration.js](#calibrationjs)

---

## index.html

**役割**: アプリケーションのエントリーポイント HTML。ブラウザが最初に読み込むファイル。

### 主要要素

- `<meta charset="UTF-8">` — 文字コードを UTF-8 に設定
- `<link rel="icon" href="/iiicon.png">` — ファビコンに `iiicon.png` を使用
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — レスポンシブ対応のビューポート設定
- `<title>個人ブログ</title>` — ブラウザタブに表示されるタイトル
- `<meta name="google-site-verification" ...>` — Google Search Console の所有権確認用メタタグ
- `<div id="root"></div>` — React アプリがマウントされる DOM 要素
- `<script type="module" src="/src/main.tsx">` — React アプリのエントリースクリプト
- Cloudflare Web Analytics の beacon スクリプト — アクセス解析用（defer 属性付きで非同期読み込み）

---

## src/main.tsx

**役割**: React アプリのエントリーポイント。`index.html` の `#root` に React ツリーをマウントする。

### インポート

- `StrictMode` — React の開発モード用コンポーネント。副作用の二重実行・非推奨 API の検出に使用
- `createRoot` — React 18 の新しいルート API
- `BrowserRouter` — react-router-dom の HTML5 History API ベースのルーター
- `./index.css` — グローバル CSS
- `App` — メインコンポーネント

### 処理フロー

1. `document.getElementById('root')` で `#root` 要素を取得（`!` で null でないことをアサート）
2. `createRoot()` で React ルートを作成
3. `.render()` で以下の順でラップしてレンダリング:
   - `StrictMode` → 開発時の警告・副作用検出
   - `BrowserRouter` → 全コンポーネントにルーティングコンテキストを提供
   - `App` → アプリ本体

---

## src/App.tsx

**役割**: アプリ全体のレイアウト・ルーティング・ヘッダー管理を担うルートコンポーネント。

### インポート

- `Routes, Route, Link` — react-router-dom のルーティング関連
- `useState, useEffect, useRef` — React フック
- `TitleCard` — カテゴリ別記事一覧コンポーネント
- `PostDetailPage` — 記事詳細ページ
- `PostForm` — 投稿フォーム
- `Profile` — 執筆者プロフィールページ
- `MapPage` — 地図ページ

### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `isSticky` | `boolean` | `false` | スクロール時のスティッキーヘッダー表示フラグ |

### ref

| ref | 型 | 用途 |
|---|---|---|
| `mainHeaderRef` | `HTMLElement` | 通常ヘッダーの高さ計測用 |
| `postFormRef` | `HTMLDivElement` | 投稿フォームへのスクロール対象 |

### 定数

- `categories` — `["温泉","料理","ねこ","技術","日常"]` — ブログカテゴリの配列
- `firstRow` — `categories.slice(0,3)` — ヘッダー1行目に表示するカテゴリ（温泉・料理・ねこ）
- `secondRow` — `categories.slice(3)` — ヘッダー2行目に表示するカテゴリ（技術・日常）

### useEffect（スクロール監視）

- 依存配列: `[]`（マウント時に1回だけ実行）
- `window.addEventListener("scroll", handleScroll)` でスクロールを監視
- `handleScroll` の処理:
  - `window.scrollY > mainHeaderRef.current.offsetHeight` が true → `setIsSticky(true)`
  - false → `setIsSticky(false)`
- クリーンアップ: `window.removeEventListener("scroll", handleScroll)` でリスナーを解除

### 関数

#### `scrollToPostForm()`
- `postFormRef.current?.scrollIntoView({ behavior: "smooth" })` でスムーズスクロール
- スティッキーヘッダーの「投稿」ボタンに紐付け

#### `scrollToTop()`
- `window.scrollTo({ top: 0, behavior: 'smooth' })` でページ最上部へスムーズスクロール
- スティッキーヘッダーの「トップ」ボタンに紐付け

### JSX 構造

**通常ヘッダー** (`<header className="site-header" ref={mainHeaderRef}>`):
- `<h1>My Blog</h1>` — ブログタイトル
- 1行目ナビ: `Link to="/"（ホーム）` + `firstRow` の各カテゴリへの `Link`
- 2行目ナビ: `secondRow` の各カテゴリへの `Link` + `Link to="/map"` + `Link to="/profile"`

**スティッキーヘッダー** (`{isSticky && (...)}` で条件レンダリング):
- `isSticky === true` の場合のみ表示
- `Link to="/profile"` — プロフィールリンク
- `<button onClick={scrollToPostForm}>投稿</button>` — 投稿フォームへスクロール
- `<button onClick={scrollToTop}>トップ</button>` — ページ最上部へスクロール

**ルーティング** (`<Routes>`):
- `path='/'` → `<TitleCard category="すべて" />`
- `path='/category/:cat'` → `<TitleCard category={cat} />` — categories の数だけ動的生成
- `path='/post/:id'` → `<PostDetailPage />`
- `path='/map'` → `<MapPage />`
- `path='/profile'` → `<Profile />`

**投稿フォーム**:
- `<div ref={postFormRef}>` 内に `<PostForm />` を配置
- どのルートでも常に表示される（Routes の外側）

---

## src/index.css

**役割**: アプリ全体のグローバルスタイル定義。Tailwind CSS と共存する手書き CSS。

### `:root` セレクタ
- フォント: `system-ui, Avenir, Helvetica, Arial, sans-serif`
- 行高: `1.5`、フォントウェイト: `400`
- カラースキーム: `light dark`（ダーク/ライト両対応）
- 文字色: `rgba(255,255,255,0.87)`（デフォルトはダークモード想定）
- 背景色: `#242424`
- フォントレンダリング最適化各種

### `#root`
- `max-width: 1280px`、`width: 100%`、中央寄せ
- `padding: 2rem`、`text-align: center`、`box-sizing: border-box`

### `a`（アンカー）
- 通常時: `color: #646cff`、`font-weight: 500`、下線なし
- ホバー時: `color: #535bf2`

### `body`
- `margin: 0`、`display: flex`、`place-items: center`
- `min-width: 320px`、`min-height: 100vh`

### `h1`
- `font-size: 3.2em`、`line-height: 1.1`

### `button`
- `border-radius: 8px`、`border: 1px solid transparent`
- `background-color: #1a1a1a`（ダーク）
- ホバー時: `border-color: #646cff`
- フォーカス時: `-webkit-focus-ring-color` でアウトライン

### `.category-card`
- 記事カードのスタイル
- 枠線、角丸（0.5rem）、影（box-shadow）、下マージン（1rem）

### `.force-bg-gray`
- 投稿ボタンの独自色: `background-color: #839be9 !important`
- ホバー時: `#494993 !important`

### `.article-image`
- 記事中の画像スタイル
- デフォルト（スマホ）: `width: 80%`、中央寄せ、角丸（0.5rem）
- `@media (min-width: 768px)`（PC）: `width: 50%`

### `@media (prefers-color-scheme: light)`
- ライトモード時の上書き:
  - 文字色: `#213547`、背景: `#ffffff`
  - ボタン背景: `#f9f9f9`

### `.sticky-header`
- `position: fixed`、`top: 0`、`width: 100%`
- 白背景、影、`z-index: 20`
- `animation: fadeInDown 0.3s ease-out` — スライドイン

### `.sticky-header nav` / `.sticky-header-inner`
- flex レイアウト、両端寄せ（`space-between`）

### `@keyframes fadeInDown`
- `from`: `opacity: 0`、`translateY(-20px)` → `to`: `opacity: 1`、`translateY(0)`

### Map 機能用スタイル

#### `.map-layout`
- `display: grid`、`grid-template-columns: 2fr 1fr`（地図:カード = 2:1）
- `gap: 1rem`、`min-height: 500px`

#### `.map-container`
- `position: sticky`、`top: 80px`（スクロール追従）
- `max-height: 80vh`

#### `.cards-container`
- `max-height: 80vh`、`overflow-y: auto`（縦スクロール）

#### `.geolonia-svg-map .prefecture`（SVG地図用、現在は未使用の可能性あり）
- ホバー時: `fill: #93c5fd`、`opacity: 0.8`

#### `.map-page-wrapper`
- MapPage の全幅レイアウト用: `display: flex`、`flex-direction: column`、`text-align: left`

#### `@media (max-width: 767px)`（スマホ・タブレット）
- `.map-layout`: `grid-template-columns: 1fr`（1列）
- `.map-container`: `position: static`、`max-height: 400px`
- `.cards-container`: 高さ制限解除

---

## src/App.css

**役割**: Vite の初期テンプレートから残存しているデフォルト CSS。現在ほぼ未使用。

### 定義内容

- `#root`: `max-width: 1920px`、`margin: 0 auto`、`padding: 2rem`（`index.css` の `#root` と競合するが後者が優先）
- `.logo`: `height: 6em`、`will-change: filter`、`transition: filter 300ms`（Vite デモ用）
- `.logo:hover`: `drop-shadow(0 0 2em #646cffaa)`
- `.logo.react:hover`: `drop-shadow(0 0 2em #61dafbaa)`
- `@keyframes logo-spin`: 360deg ループアニメーション
- `@media (prefers-reduced-motion: no-preference)`: ロゴスピンアニメーション適用
- `.card`: `padding: 2em`（Vite デモ用）
- `.read-the-docs`: `color: #888`（Vite デモ用）

---

## src/vite-env.d.ts

**役割**: Vite が提供する型定義ファイルの参照。

### 内容
- `/// <reference types="vite/client" />` — `import.meta.env` の型（`VITE_*` 環境変数）を有効化する1行のみ

---

## src/category/title_card.tsx

**役割**: 記事一覧を表示するコンポーネント。カテゴリによる絞り込みと記事削除機能を持つ。

### インポート

- `React, useEffect, useState` — React 本体
- `Link` — react-router-dom のリンクコンポーネント
- `PostData` — `../../functions/api/post.ts` からの型（注: パスはレガシーで実際は `_worker.ts` で定義）

### 型定義

```ts
type TitleCardProps = { category: string; }
type ApiResponse = { posts: PostData[]; }
```

### Props

| prop | 型 | 用途 |
|---|---|---|
| `category` | `string` | 表示するカテゴリ名。`"すべて"` の場合は全記事表示 |

### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `posts` | `PostData[]` | `[]` | API から取得した全記事の配列 |

### useEffect（初回データ取得）

- 依存配列: `[]`（マウント時1回）
- `fetch('/api/post')` で全記事を取得
- `.then(res => res.json())` → `.then(data => setPosts(...))` でステートに格納

### 関数

#### `handleDelete(postId: number)`
- `window.confirm("この記事を本当に削除しますか？")` — 確認ダイアログ
  - キャンセル → 早期 return
- `window.prompt("削除するにはパスワードを入力してください：")` — パスワード入力
  - null または空文字 → 早期 return
- `fetch('/api/post/${postId}', { method: "DELETE", headers: { 'X-Auth-Password': password } })` — DELETE リクエスト送信
- **成功時** (`res.ok`): `alert("記事を削除しました。")` + `setPosts(posts.filter(post => post.id !== postId))` でリアルタイム削除
- **失敗時**: `alert("記事の削除に失敗しました。")`

### フィルタリングロジック

```ts
const filteredPosts = category === "すべて"
  ? posts
  : posts.filter(post => post.category === category);
```

- `"すべて"` → 全記事
- それ以外 → 一致するカテゴリの記事のみ

### JSX 構造

- `<h1>{category}の記事一覧</h1>` — ページタイトル
- `filteredPosts.length === 0` の場合: `<p>このカテゴリの記事はまだありません。</p>`
- それ以外: `filteredPosts.map(post => ...)` で各記事カードを生成

**記事カード（`<div className="category-card">`）の内容:**
- `new Date(post.created_at).toLocaleString()` — 作成日時
- `post.id` — 記事 ID
- `<h2>{post.title}</h2>` — タイトル（`break-words` クラスで長文折り返し）
- `{post.image_url && <img src={post.image_url} ... />}` — アイキャッチ画像（条件付き表示）
- `post.content.slice(0, 50)` — 本文の最初50文字（プレビュー）
- `<Link to={'/post/${post.id}'}>続きを読む</Link>` — 詳細ページへのリンク
- `<button onClick={() => handleDelete(post.id)}>削除</button>` — 削除ボタン（赤色）

---

## src/components/PostDetailPage.tsx

**役割**: 個別記事の詳細表示ページ。Markdown レンダリング・シンタックスハイライト・前ページ戻りを担う。

### インポート

- `useState, useEffect` — React フック
- `useParams, Link, useNavigate` — react-router-dom
- `PostData` — 記事データ型
- `ReactMarkdown` — Markdown → HTML 変換ライブラリ
- `Prism as SyntaxHighlighter` — コードブロックのシンタックスハイライター
- `vscDarkPlus` — VS Code ダークテーマのシンタックスハイライトスタイル
- `remarkBreaks` — remark プラグイン（改行を `<br>` に変換）

### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `post` | `PostData \| null` | `null` | 取得した記事データ |
| `loading` | `boolean` | `true` | 読み込み中フラグ |
| `error` | `string \| null` | `null` | エラーメッセージ |

### フック

- `useParams<{ id: string }>()` — URL の `:id` を取得
- `useNavigate()` — ナビゲーション関数を取得

### 関数

#### `handleGoBack(e: React.MouseEvent<HTMLAnchorElement>)`
- `e.preventDefault()` — デフォルトのリンク動作をキャンセル
- `navigate(-1)` — ブラウザ履歴を1つ前に戻る（`<a href="#">` の `&larr; 記事一覧に戻る` に紐付け）

### useEffect（記事データ取得）

- 依存配列: `[id]` — id が変わるたびに再実行
- 内部の非同期関数 `fetchPost()`:
  1. `fetch('/api/post/${id}')` でリクエスト
  2. `res.ok` が false → `throw new Error('記事の読み込みに失敗しました。')`
  3. `res.json<{ post: PostData }>()` でパース → `setPost(data.post)`
  4. catch: `setError(err.message)` でエラー保存
  5. finally: `setLoading(false)` で読み込み終了

### 条件付きレンダリング（早期 return）

- `loading === true` → `<div>ローディング中...</div>`
- `error !== null` → `<div className="text-red-500">{error}</div>`
- `post === null` → `<div>記事が見つかりません。</div>`

### JSX 構造（記事表示）

- `<Link to="#" onClick={handleGoBack}>← 記事一覧に戻る</Link>` — 戻るリンク
- `<h1>{post.title}</h1>` — 記事タイトル（3xl フォント）
- カテゴリ（`Link to='/category/${post.category}'`）と作成日時表示
- `{post.image_url && <img src={post.image_url} ...>}` — アイキャッチ画像（条件付き）
- `<ReactMarkdown>` — Markdown 本文のレンダリング:
  - `remarkPlugins={[remarkBreaks]}` — 改行を `<br>` に変換
  - **カスタムコンポーネント `code`**: コードブロックのハイライト
    - `className` から `/language-(\w+)/` で言語を抽出
    - 言語が一致 → `<SyntaxHighlighter style={vscDarkPlus} language={match[1]}>` でハイライト
    - 言語なし → 通常の `<code>` タグ
  - **カスタムコンポーネント `img`**: 画像の中央寄せ
    - `className="article-image"`、`style={{ display:'block', marginLeft:'auto', marginRight:'auto' }}`

---

## src/components/PostForm.tsx

**役割**: 新規記事投稿フォーム。スラッシュコマンドによる記事内への画像・コード・リンク挿入機能を持つ。

### インポート

- `useState, useRef, useCallback` — React フック

### 型定義

```ts
type Command = {
  trigger: string;    // コマンドトリガー文字列（例: "/image"）
  label: string;      // 表示ラベル
  description: string; // 説明文
  icon: string;       // アイコン絵文字
  action: () => void; // 実行する関数
}
```

### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `title` | `string` | `""` | 記事タイトル |
| `category` | `string` | `""` | 選択カテゴリ |
| `content` | `string` | `""` | 記事本文（Markdown）|
| `imageFile` | `File \| null` | `null` | アイキャッチ画像ファイル |
| `password` | `string` | `""` | 投稿パスワード |
| `showCommands` | `boolean` | `false` | コマンドポップアップ表示フラグ |
| `commandSearch` | `string` | `""` | コマンド検索文字列（例: `/img`）|
| `selectedCommandIndex` | `number` | `0` | 選択中コマンドのインデックス |

### ref

| ref | 型 | 用途 |
|---|---|---|
| `contentInputRef` | `HTMLTextAreaElement` | 本文テキストエリアへの参照 |
| `hiddenImageInputRef` | `HTMLInputElement` | 非表示の画像ファイル input への参照 |
| `contentRef` | `string`（mutable） | 最新の `content` 値を常に保持（stale closure 防止用）|

- `contentRef.current = content` をレンダリングのたびに同期

### 定数

- `categories` — `["温泉", "料理", "ねこ", "技術", "日常"]`

### 関数

#### `uploadImageForContent(file: File): Promise<string>`
- `FormData` を作成し `image` フィールドにファイルを追加
- `fetch("/api/upload-image", { method: "POST", body: formData })` でアップロード
- `res.ok` の場合: `data.image_url` を返す（なければ空文字）
- `res.ok` でない場合: `throw new Error('画像のアップロードに失敗しました')`

#### `handleInsertImage()`
- `hiddenImageInputRef.current?.click()` — 非表示の file input をプログラム的にクリック
- ファイル選択ダイアログを開く

#### `insertTextAtCursor(text: string)` ※ `useCallback([], [])`
- `contentInputRef.current` からテキストエリアを取得
- `textarea.selectionStart / selectionEnd` でカーソル位置取得
- **`contentRef.current`**（最新のcontent）を使って新しい内容を構築:
  ```
  newContent = latest.substring(0, start) + text + latest.substring(end)
  ```
- `setContent(newContent)` と `contentRef.current = newContent` を両方更新
- `setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + text.length; textarea.focus(); }, 0)` — レンダリング後にカーソルを挿入テキストの末尾へ移動

#### `handleContentImageSelect(e: React.ChangeEvent<HTMLInputElement>)` ※ `useCallback`
- `e.target.files && e.target.files[0]` が存在する場合:
  1. `uploadImageForContent(file)` で画像をアップロード
  2. 成功: `insertTextAtCursor(`![${file.name}](${imageUrl})`)` — Markdown形式で挿入
  3. 失敗: `alert('画像のアップロードに失敗しました: ...')`
  4. 最後に必ず `e.target.value = ''` — 同じファイルを再選択できるようにリセット

### コマンド定義（`commands: Command[]`）

| trigger | label | action |
|---|---|---|
| `/image` | 画像を挿入 | `handleInsertImage()` |
| `/code` | コードブロック | `insertTextAtCursor('\n```\n\n```\n')` |
| `/link` | リンク | `insertTextAtCursor('[リンクテキスト](URL)')` |

### コマンドフィルタリング

```ts
const filteredCommands = commandSearch
  ? commands.filter(cmd => cmd.trigger.startsWith(commandSearch.toLowerCase()))
  : commands;
```

- `commandSearch` が空 → 全コマンドを表示
- 入力あり → `trigger` が `commandSearch` で始まるものだけ表示

### `handleContentChange(e)`

テキストエリアの `onChange` ハンドラ:
1. `setContent(newContent)` で本文を更新
2. `textBeforeCursor = newContent.substring(0, cursorPos)` — カーソル前のテキスト
3. `lastSlashIndex = textBeforeCursor.lastIndexOf('/')` — 最後の `/` の位置
4. **条件分岐**:
   - `lastSlashIndex !== -1` かつ `textAfterSlash` にスペース・改行がない:
     - `setCommandSearch(textAfterSlash)` — コマンド検索文字を更新
     - `setShowCommands(true)` — ポップアップ表示
     - `setSelectedCommandIndex(0)` — 選択をリセット
     - `return`（以降の処理をスキップ）
   - それ以外: `setShowCommands(false)`, `setCommandSearch("")`

### `handleContentKeyDown(e)`

テキストエリアの `onKeyDown` ハンドラ:
- `showCommands === false` → 早期 return
- **ArrowDown**: `selectedCommandIndex` を `filteredCommands.length - 1` まで増加（`e.preventDefault()`）
- **ArrowUp**: `selectedCommandIndex` を `0` まで減少（`e.preventDefault()`）
- **Enter**: `executeCommand(filteredCommands[selectedCommandIndex])`（`e.preventDefault()`）
- **Escape**: `setShowCommands(false)`, `setCommandSearch("")`（`e.preventDefault()`）

### `executeCommand(command: Command)`

1. `command` が falsy → 早期 return
2. `textarea.selectionStart` でカーソル位置取得
3. `lastSlashIndex` でコマンド開始位置特定
4. `setContent(content.substring(0, lastSlashIndex) + content.substring(cursorPos))` — スラッシュコマンド文字を削除
5. `setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = lastSlashIndex; }, 0)` — カーソルを調整（`textarea.focus()` は呼ばない ← ファイルダイアログと競合防止のため削除済み）
6. `setShowCommands(false)`, `setCommandSearch("")`
7. **`command.action()`** を同期的に実行

### `handleSubmit(e)`

フォーム送信ハンドラ（投稿ボタン押下時）:
1. `e.preventDefault()` でデフォルト送信を防止
2. `FormData` を作成して各フィールドを追加:
   - `title`, `category`, `content`, `password`
3. `imageFile !== null` の場合: `formData.append('image', imageFile)` でアイキャッチ画像を追加
4. `fetch("/api/post", { method: "POST", body: formData })` で送信
5. `res.ok` の場合: `alert("投稿が保存されました!")` + `window.location.reload()`
6. 失敗の場合: `res.text()` でエラー内容取得 → `alert("エラー:" + err)`

### JSX 構造

- タイトル input（`maxLength={30}`）+ カテゴリ select（`required`）
- アイキャッチ画像 file input（`id="image-upload"`, `accept="image/*"`）:
  - `onChange`: ファイルがあれば `setImageFile(e.target.files[0])`、なければ `setImageFile(null)`
- 本文エリア（`<div className="relative">`）:
  - `<textarea ref={contentInputRef}>` — コマンド入力対応テキストエリア
  - `{showCommands && filteredCommands.length > 0 && (...)}` — コマンドポップアップ（条件付き）:
    - 「コマンド候補」ラベル
    - 各コマンドを `<button type="button" onClick={() => executeCommand(cmd)}>` で表示
    - 選択中は `bg-blue-100` でハイライト
    - 操作説明（↑↓: 選択 | Enter: 実行 | Esc: キャンセル）
  - `<input ref={hiddenImageInputRef} type="file" accept="image/*" onChange={handleContentImageSelect} className="hidden">` — 非表示のファイル選択 input
- パスワード input（`type="password"`, `required`）
- 投稿ボタン（`type="submit"`, `className="force-bg-gray"`）

---

## src/components/profile.tsx

**役割**: ブログ執筆者のプロフィールを表示する静的コンポーネント。

### 内容

- `<h2>~ブログ執筆者紹介~</h2>`
- 年齢: 21歳
- 職業: 学生（情報系大学生）
- 趣味: 猫、ゲーム、アニメ、温泉巡り
- アルバイト: パン屋、GIS開発
- GitHub リンク: `https://github.com/sakanataro0113`（`target="_blank"`, `rel="noopener noreferrer"`）

状態管理・副作用・関数は一切なし。純粋な静的表示コンポーネント。

---

## src/components/MapPage.tsx

**役割**: 地図と訪問地点カード一覧を表示するページ。地点の追加・削除機能を持つ。2つのコンポーネント（`MapPage`, `MapLocationForm`）と1つの定数（`prefectures`）で構成される。

---

### コンポーネント: `MapPage`

#### インポート
- `React, useEffect, useState` — React
- `Link` — react-router-dom
- `GoogleMapComponent` — Google Maps 表示コンポーネント
- `MapLocation` — 地点データ型（GoogleMapComponent から）
- `PinLocationModalGoogleMaps` — ピン位置設定モーダル

#### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `locations` | `MapLocation[]` | `[]` | 取得済み地点データの配列 |
| `selectedLocation` | `MapLocation \| null` | `null` | 地図ピンクリックで選択された地点 |

#### useEffect（地点データ取得）

- 依存配列: `[]`（マウント時1回）
- `fetch('/api/map-locations')` で地点一覧を取得
- `response.success && response.locations` が true の場合:
  - `created_at` の昇順（古い順）でソート
  - `setLocations(sortedLocations)`
- catch: `console.error(...)` のみ

#### 関数

##### `handlePinClick(location: MapLocation)`
- `setSelectedLocation(location)` で選択状態を更新
- `document.getElementById('location-card-${location.id}')` の要素を `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` でスクロール表示

##### `handleDelete(locationId: number)`
- `window.confirm(...)` — 削除確認ダイアログ
  - キャンセル → return
- `window.prompt(...)` — パスワード入力
  - null or 空文字 → return
- `fetch('/api/map-locations/${locationId}', { method: "DELETE", headers: { 'X-Auth-Password': password } })` で削除リクエスト
- 成功: `alert("地点を削除しました。")` + `setLocations(locations.filter(...))` でリアルタイム削除 + `selectedLocation?.id === locationId` の場合は `setSelectedLocation(null)`
- 失敗: `alert("地点の削除に失敗しました。")`

#### JSX 構造

- `<div className="map-page-wrapper">` — 全体ラッパー
- `<h1>Map - 訪問地点</h1>`
- **グリッドレイアウト（`.map-layout`）**:
  - 左側（`.map-container`）: `<GoogleMapComponent locations={locations} onLocationClick={handlePinClick} height="80vh" />`
  - 右側（`.cards-container`）: 地点カード一覧
    - `locations.length === 0` → `<p>まだ地点が登録されていません。</p>`
    - それ以外 → `locations.map((location, index) => ...)`:
      - カードの `id`: `location-card-${location.id}`（スクロール対象）
      - 選択中のカードは `backgroundColor: '#fff3cd'`（黄色）、それ以外は `white`
      - `No. {index + 1}` — 番号表示
      - `{location.name}（{location.prefecture}）` — 地名と都道府県
      - 座標表示（`latitude` と `longitude` が `null` でない場合）
      - `{location.memo}` — メモ
      - **関連記事リンク**（即時実行関数で条件分岐）:
        1. `location.linked_post_ids` が存在 → `JSON.parse()` で配列化 → 各 ID を `<Link to='/post/${postId}'>記事 #{postId} →</Link>` として表示（parse 失敗時は `console.error()`）
        2. `location.linked_post_id` が存在（後方互換） → `<Link to='/post/${location.linked_post_id}'>関連記事を見る →</Link>`
        3. どちらもなし → `null`
      - 作成日時（`toLocaleString('ja-JP')`）
      - 削除ボタン（`handleDelete(location.id)` に紐付け）
- **地点追加フォーム**:
  - `<MapLocationForm onSubmit={(newLocation) => setLocations([...locations, newLocation])} />`

---

### 定数: `prefectures`

47都道府県の名称配列（北海道〜沖縄）。`MapLocationForm` のセレクトボックスに使用。

---

### コンポーネント: `MapLocationForm`

新しい地点を追加するフォームコンポーネント。

#### Props
- `onSubmit: (location: MapLocation) => void` — 追加成功後に呼ばれるコールバック

#### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `name` | `string` | `''` | 場所の名前 |
| `prefecture` | `string` | `'東京'` | 都道府県 |
| `memo` | `string` | `''` | メモ |
| `linkedPostIds` | `string` | `''` | 関連記事ID（カンマ区切り文字列）|
| `latitude` | `number \| null` | `null` | 緯度 |
| `longitude` | `number \| null` | `null` | 経度 |
| `isModalOpen` | `boolean` | `false` | ピン位置設定モーダルの開閉フラグ |

#### 関数

##### `handleSubmit(e: React.FormEvent)`
1. `e.preventDefault()`
2. `!name || !prefecture || !memo` → `alert(...)` で early return
3. `window.prompt(...)` でパスワード入力 → 空なら early return
4. `!latitude || !longitude` → `alert(...)` でピン位置未設定の場合 early return
5. `FormData` 構築:
   - `name`, `prefecture`, `memo`, `password`, `latitude`, `longitude` を追加
   - `linkedPostIds.trim()` が空でない場合: カンマで分割 → trim → filter(空除去) → `JSON.stringify()` して `linked_post_ids` として追加
6. `fetch('/api/map-locations', { method: 'POST', body: formData })` で送信
7. `data.success && data.location` → `alert("地点を追加しました！")` + `onSubmit(data.location)` + フォームリセット
8. 失敗: `alert('エラー: ${data.error}')`
9. catch: `console.error()` + `alert('地点の追加に失敗しました。')`

##### `handleOpenPinModal()`
- `setIsModalOpen(true)` — ピン位置設定モーダルを開く

##### `handlePinConfirm(lat: number, lng: number)`
- `setLatitude(lat)`, `setLongitude(lng)` — モーダルで選択した座標を受け取る

#### JSX 構造

- 名前テキスト input
- 都道府県セレクト（`prefectures` 配列から `<option>` 生成）
- **ピン位置設定セクション**（必須、緑色のボーダーで強調）:
  - `<button onClick={handleOpenPinModal}>🎯 Google Mapsで位置を設定</button>`
  - `latitude !== null && longitude !== null` の場合: 緯度経度を表示
  - 補足テキスト
- メモ textarea
- 関連投稿ID input（カンマ区切りで複数入力可）
- 送信ボタン
- `<PinLocationModalGoogleMaps isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} prefecture={prefecture} initialLat={latitude ?? 36.2048} initialLng={longitude ?? 138.2529} onConfirm={handlePinConfirm} />`

---

## src/components/GoogleMapComponent.tsx

**役割**: Google Maps を表示・操作する汎用コンポーネント。マーカー表示・ピン配置モード・情報ウィンドウを担う。

### インポート
- `React, useEffect, useRef, useState`
- Google Maps の型は `@types/google.maps` から暗黙的に参照

### 型定義

#### `MapLocation`（export あり）
```ts
interface MapLocation {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id: number | null;
  linked_post_ids: string | null;   // JSON配列文字列
  x_coordinate: number | null;
  y_coordinate: number | null;
  created_at: string;
  latitude?: number;
  longitude?: number;
}
```

#### `GoogleMapComponentProps`
```ts
interface GoogleMapComponentProps {
  locations: MapLocation[];
  onLocationClick?: (location: MapLocation) => void;  // ピンクリック時
  onMapClick?: (lat: number, lng: number) => void;    // 地図クリック時（ピン配置モード）
  clickableForPinPlacement?: boolean;                  // ピン配置モードフラグ
  height?: string;                                     // 地図の高さ
}
```

### ユーティリティ関数

#### `loadGoogleMapsScript(apiKey: string): Promise<void>`
- `window.google && window.google.maps` が存在 → 即 resolve（二重ロード防止）
- `<script>` タグを動的に `document.head` に追加
- `src`: `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
- `async`, `defer` 属性付き
- `script.onload` → resolve、`script.onerror` → reject

### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `map` | `google.maps.Map \| null` | `null` | 地図インスタンス |
| `markers` | `google.maps.Marker[]` | `[]` | 配置済みマーカーの配列 |
| `isLoaded` | `boolean` | `false` | Maps API 読み込み完了フラグ |
| `error` | `string \| null` | `null` | エラーメッセージ |
| `tempMarker` | `google.maps.Marker \| null` | `null` | ピン配置モード用仮マーカー |

### ref
- `mapRef` — `HTMLDivElement` — 地図を描画する DOM 要素への参照

### 環境変数
- `apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY` — `.env` から取得

### useEffect 1（API ロード）

- 依存配列: `[apiKey]`
- `!apiKey` → `setError('Google Maps APIキーが設定されていません')` で return
- `loadGoogleMapsScript(apiKey)`:
  - 成功 → `setIsLoaded(true)`
  - 失敗 → `console.error()` + `setError('Google Maps APIの読み込みに失敗しました')`

### useEffect 2（地図初期化）

- 依存配列: `[isLoaded, map, clickableForPinPlacement, onMapClick]`
- `!isLoaded || !mapRef.current || map` → return（条件不成立なら何もしない）
- `new google.maps.Map(mapRef.current, {...})` で地図を作成:
  - center: 日本の中心（lat: 36.2048, lng: 138.2529）
  - zoom: 6
  - `mapTypeControl: true`、`streetViewControl: false`、`fullscreenControl: true`
- **ピン配置モード** (`clickableForPinPlacement && onMapClick`):
  - `newMap.addListener('click', ...)` で地図クリックイベントを登録
  - クリック時:
    1. 緯度経度を取得して `onMapClick(lat, lng)` を呼ぶ
    2. 既存の `tempMarker` を `setMap(null)` で除去
    3. 緑色アイコンの新しいマーカーを作成して `setTempMarker(newTempMarker)`
- `setMap(newMap)` で地図インスタンスを保存

### useEffect 3（マーカー配置）

- 依存配列: `[map, locations, onLocationClick]`
- `!map` → return
- 既存の `markers` を `marker.setMap(null)` で全て削除
- `locations` から `latitude && longitude` があるものだけフィルタ
- 各 location に対して赤色マーカーを作成:
  - `new google.maps.Marker({ position: {lat, lng}, map, title: location.name, icon: 赤ドット })`
  - `new google.maps.InfoWindow({ content: HTML文字列 })` で情報ウィンドウを作成（name, prefecture, memo を表示）
  - マーカークリック時: `infoWindow.open(map, marker)` + `onLocationClick?.(location)`
- `setMarkers(newMarkers)` で保存

### 条件付きレンダリング

- `error !== null` → エラー表示 div（赤背景）
- `!isLoaded` → 「地図を読み込み中...」div（グレー背景）
- それ以外 → `<div ref={mapRef} style={{ width:'100%', height, borderRadius:'8px', border:'1px solid #ccc' }} />`

---

## src/components/PinLocationModalGoogleMaps.tsx

**役割**: 地点登録時にGoogle Maps上でピン位置を視覚的に選択するモーダルダイアログ。

### インポート
- `React, useState`
- `GoogleMapComponent` — 地図描画

### 型定義（Props）

```ts
interface PinLocationModalGoogleMapsProps {
  isOpen: boolean;              // モーダルの開閉フラグ
  onClose: () => void;          // 閉じる時のコールバック
  prefecture: string;           // 説明文に表示する都道府県名
  initialLat?: number;          // 初期緯度（デフォルト: 36.2048）
  initialLng?: number;          // 初期経度（デフォルト: 138.2529）
  onConfirm: (lat: number, lng: number) => void;  // 位置決定時のコールバック
}
```

### 状態管理

| state | 型 | 初期値 | 用途 |
|---|---|---|---|
| `selectedLat` | `number` | `initialLat` | 選択中の緯度 |
| `selectedLng` | `number` | `initialLng` | 選択中の経度 |

### 関数

#### `handleMapClick(lat: number, lng: number)`
- `setSelectedLat(lat)`, `setSelectedLng(lng)` — 地図クリック位置を選択座標として保存

#### `handleConfirm()`
- `onConfirm(selectedLat, selectedLng)` — 確定座標を親コンポーネントへ渡す
- `onClose()` — モーダルを閉じる

### 条件付きレンダリング

- `!isOpen` → `return null`（モーダル非表示）

### JSX 構造

- **背景オーバーレイ**（`position: fixed`, `rgba(0,0,0,0.7)`, `z-index: 1000`）:
  - `onClick={onClose}` — 背景クリックで閉じる
- **モーダル本体**（`onClick={(e) => e.stopPropagation()}` — イベント伝播を止める）:
  - タイトル「ピンの位置を設定」
  - 説明文（`prefecture` を含む）
  - 現在の座標表示（`selectedLat.toFixed(6)`, `selectedLng.toFixed(6)`）
  - `<GoogleMapComponent locations={[]} onMapClick={handleMapClick} clickableForPinPlacement={true} height="500px" />` — ピン配置モードで地図を表示
  - 「キャンセル」ボタン → `onClose()`
  - 「この位置に決定」ボタン → `handleConfirm()`

---

## _worker.ts

**役割**: Cloudflare Workers 上で動作するバックエンド API サーバー。Hono フレームワークを使用。静的ファイル（React ビルド成果物）の配信も担う。

### インポート
- `Hono` — 軽量 Web フレームワーク
- `serveStatic` — Cloudflare Pages 向け静的ファイル配信ミドルウェア
- `D1Database, R2Bucket` — Cloudflare Workers の型定義

### 型定義

#### `Bindings`（環境バインディング）
```ts
type Bindings = {
  DB: D1Database;          // D1 SQLiteデータベース
  IMAGE_BUCKET: R2Bucket;  // R2 オブジェクトストレージ
  R2_PUBLIC_URL: string;   // R2 公開 URL（例: https://...r2.dev）
  SECRET_KEY: string;      // 投稿・削除用パスワード
}
```

#### `PostRequestBody`
- フロントエンドからの投稿リクエスト用型（`id`, `created_at` は含まない）
- `title: string`, `category: string`, `image_url?: string`, `content: string`, `password: string`

#### `PostData`
- DB から取得した完全な記事データ型
- `id: number`, `title: string`, `category: string`, `image_url: string | null`, `content: string`, `created_at: string`

#### `MapLocation`
- 地図地点データ型
- `id: number`, `name: string`, `prefecture: string`, `memo: string`
- `linked_post_id: number | null`（後方互換性用）
- `linked_post_ids: string | null`（JSON配列文字列）
- `x_coordinate: number | null`, `y_coordinate: number | null`（旧SVG地図用）
- `latitude: number | null`, `longitude: number | null`（Google Maps用）
- `created_at: string`

#### `Platform`
- `next: (request: Request) => Response | Promise<Response>` — Cloudflare Pages のフォールバック関数

#### `Env`
- `Bindings: { DB, IMAGE_BUCKET, R2_PUBLIC_URL, SECRET_KEY } & Platform`
- Hono に渡す完全な環境型

### Hono アプリの初期化

```ts
const app = new Hono<Env>();
```

---

### APIエンドポイント一覧

#### `POST /api/post` — 新規記事の作成

1. `c.req.formData()` でフォームデータ取得
2. `password` を取得 → `c.env.SECRET_KEY` と比較
   - 不一致 → `401 Unauthorized`
3. `title`, `category`, `content`, `imageFile` を取得
4. `imageFile instanceof File && imageFile.size > 0` の場合:
   - `imageFile.arrayBuffer()` で ArrayBuffer 取得
   - `${Date.now()}-${imageFile.name}` でファイル名生成
   - `c.env.IMAGE_BUCKET.put(fileName, imageBuffer)` で R2 に保存
   - `image_url = '${c.env.R2_PUBLIC_URL}/${fileName}'` で URL 生成
5. バリデーション:
   - `title.length > 30` → `400`（タイトルは30文字以内）
   - `!title || !content || !category` → `400`（必須項目チェック）
6. `created_at = new Date().toISOString()` でタイムスタンプ生成（サーバー側）
7. `INSERT INTO posts (title, category, image_url, content, created_at) VALUES (?, ?, ?, ?, ?)` で DB 挿入
8. `result.meta.last_row_id` で挿入した ID 取得
9. `SELECT * FROM posts WHERE id = ?` で新しい投稿を取得
10. `201 Created` でレスポンス
11. catch → `500 Internal Server Error`

---

#### `GET /api/post` — 記事一覧取得

1. `c.req.query('category')` でクエリパラメータ取得
2. **分岐**:
   - `category` あり → `SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC`
   - `category` なし → `SELECT * FROM posts ORDER BY created_at DESC`
3. `query.all()` で全件取得
4. `200` で `{ success: true, posts: results }` を返す
5. catch → `500`

---

#### `GET /api/post/:id` — 記事単件取得

1. `c.req.param('id')` で ID 取得
2. `SELECT * FROM posts WHERE id = ?` で1件取得
3. `post` が存在 → `200` で `{ success: true, post }` を返す
4. `post` が null → `404`
5. catch → `500`

---

#### `DELETE /api/post/:id` — 記事削除

1. `c.req.header('X-Auth-Password')` でヘッダーからパスワード取得
2. パスワード照合（null or 不一致） → `401`
3. `c.req.param('id')` で対象 ID 取得
4. ID が null → `400`
5. `DELETE FROM posts WHERE id = ?` で削除実行
6. `result.meta.changes > 0` → `200` 成功レスポンス
7. `changes === 0` → `404`（該当なし）
8. catch → `500`（エラーメッセージ付き）

---

#### `POST /api/upload-image` — 記事内画像のアップロード（パスワード不要）

1. `c.req.formData()` でフォームデータ取得
2. `formData.get('image')` で画像ファイル取得
3. `!(imageFile instanceof File) || imageFile.size === 0` → `400`
4. `imageFile.arrayBuffer()` で取得
5. `${Date.now()}-${imageFile.name}` でファイル名生成
6. `c.env.IMAGE_BUCKET.put(fileName, imageBuffer)` で R2 に保存
7. `image_url = '${c.env.R2_PUBLIC_URL}/${fileName}'` で URL 生成
8. `200` で `{ success: true, image_url }` を返す
9. catch → `500`

**注意**: このエンドポイントはパスワード不要のため、認証なしで誰でも画像をアップロードできる。

---

#### `GET /api/map-locations` — 地図地点一覧取得

1. `SELECT * FROM map_locations ORDER BY created_at DESC` で全件取得
2. `200` で `{ success: true, locations: results }` を返す
3. catch → `500`

---

#### ユーティリティ関数: `convertLatLonToXY(lat, lon)`

緯度経度を SVG 地図用の XY 座標（0〜100）に変換する内部関数。

**変換パラメータ（多点校正済み）**:
- `LAT_MIN = 30.0`, `LAT_MAX = 45.5`（南端〜北海道北端）
- `LON_MIN = 129.0`, `LON_MAX = 145.8`（西端〜東端）

**計算式**:
- `y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100`（上が小、下が大）
- `x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100`（左が小、右が大）
- `Math.max(0, Math.min(100, x/y))` で 0〜100 の範囲に制限

---

#### `POST /api/map-locations` — 地点追加

1. `c.req.formData()` でデータ取得
2. パスワード照合 → 不一致で `401`
3. `name`, `prefecture`, `memo`, `linked_post_id`, `linked_post_ids`, `latitude`, `longitude`, `x_coordinate`, `y_coordinate` を取得
4. `!name || !prefecture || !memo` → `400`
5. 座標処理（2系統）:
   - **旧形式（XY直接指定）**: `xCoordinateStr && yCoordinateStr` があれば `parseFloat()` して `xCoord`, `yCoord` に設定
   - **新形式（緯度経度）**: `latitude && longitude` があれば `parseFloat()` → `convertLatLonToXY()` で XY 変換も実施（後方互換）
6. `INSERT INTO map_locations (name, prefecture, memo, linked_post_id, linked_post_ids, latitude, longitude, x_coordinate, y_coordinate, created_at) VALUES (?)` で DB 挿入
7. 挿入した地点を SELECT して `201` で返す
8. catch → `500`

---

#### `DELETE /api/map-locations/:id` — 地点削除

1. `c.req.header('X-Auth-Password')` でパスワード取得・照合 → 不一致で `401`
2. `c.req.param('id')` で ID 取得 → null で `400`
3. `DELETE FROM map_locations WHERE id = ?` で削除
4. `changes > 0` → `200` 成功
5. `changes === 0` → `404`
6. catch → `500`

---

#### `GET *` — 静的ファイル配信

```ts
app.get('*', serveStatic());
```

- Hono の `serveStatic` ミドルウェアが `dist/` フォルダから静的ファイルを自動配信
- マッチしない URL は React の `index.html` にフォールバック（SPA ルーティング対応）

---

### エクスポート

```ts
export default app;
```

Cloudflare Workers のエントリーポイントとして Hono アプリをエクスポート。

---

## vite.config.ts

**役割**: Vite のビルド設定ファイル。

### 内容

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
})
```

- `@vitejs/plugin-react-swc` — SWC（Rust 製トランスパイラ）を使った高速 React プラグイン
- プロキシ設定なし → **dev サーバーでは `/api/*` は存在しない**（Cloudflare Workers デプロイ後のみ動作）

---

## wrangler.toml

**役割**: Cloudflare Workers / Pages のデプロイ設定ファイル。

### 内容

```toml
[[d1_databases]]
binding = "DB"
database_name = "my_blog_db"
database_id = "2ed1b42f-2615-44e9-8528-8477843bebd6"
```

- D1 データベース `my_blog_db` を `DB` という名前で Workers にバインド
- **注意**: `IMAGE_BUCKET`（R2）と `SECRET_KEY` の設定は Cloudflare ダッシュボードまたは別の設定で管理されており、このファイルには記載なし

---

## package.json

**役割**: プロジェクトの依存関係・スクリプト定義。

### スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | `vite` — 開発サーバー起動 |
| `npm run build` | `build:client` + `build:worker` の順で実行 |
| `npm run build:client` | `tsc -b && vite build` — TypeScript コンパイル + Vite ビルド |
| `npm run build:worker` | `esbuild _worker.ts --bundle --format=esm --outfile=dist/_worker.js` — Worker のバンドル |
| `npm run lint` | `eslint .` — Lint チェック |
| `npm run preview` | `vite preview` — ビルド結果のプレビュー |

### 依存パッケージ（dependencies）

| パッケージ | 用途 |
|---|---|
| `heic2any` | HEIC 画像変換（現在コードでは未使用の可能性あり） |
| `hono` | バックエンドフレームワーク（Workers用）|
| `react` | React 本体（v19.1.0）|
| `react-dom` | React DOM |
| `react-markdown` | Markdown レンダリング |
| `react-router-dom` | ルーティング（v7）|
| `react-syntax-highlighter` | コードシンタックスハイライト |
| `remark-breaks` | Markdown の改行変換プラグイン |

### 開発依存パッケージ（devDependencies）

| パッケージ | 用途 |
|---|---|
| `@cloudflare/workers-types` | Cloudflare Workers の型定義 |
| `@eslint/js` | ESLint 本体 |
| `@types/google.maps` | Google Maps API の型定義 |
| `@types/react`, `@types/react-dom` | React の型定義 |
| `@types/react-syntax-highlighter` | シンタックスハイライターの型定義 |
| `@vitejs/plugin-react-swc` | Vite の React プラグイン（SWC使用）|
| `eslint` | Lint ツール |
| `eslint-plugin-react-hooks` | React Hooks の Lint ルール |
| `eslint-plugin-react-refresh` | Fast Refresh の Lint ルール |
| `globals` | ESLint 用グローバル変数定義 |
| `typescript` | TypeScript コンパイラ（v5.8.3）|
| `typescript-eslint` | TypeScript 用 ESLint |
| `vite` | ビルドツール（v7）|

---

## migrations/0001_init.sql

**役割**: D1 データベースの初期マイグレーションファイル。`posts` テーブルを作成する。

### テーブル定義: `posts`

```sql
CREATE TABLE posts (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  title      TEXT     NOT NULL,
  category   TEXT     NOT NULL,
  image_url  TEXT,                                      -- アイキャッチ画像URL（nullable）
  content    TEXT     NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**注意**: `map_locations` テーブルの定義はこのファイルには含まれていない。後から追加されたテーブルと考えられる。

---

## calibration.js

**役割**: SVG 地図（旧機能）用の座標変換パラメータを校正するためのスタンドアロンスクリプト。本番コードには含まれない開発ツール。

### 定数: `referencePoints`

実際の緯度経度とSVG地図上の XY 座標の対応表（7都府県）:
- 東京: `lat:35.6762, lon:139.6503` → `x:67, y:47`
- 北海道: `lat:43.0642, lon:141.3469` → `x:75, y:10`
- 神奈川: `lat:35.4478, lon:139.6425` → `x:65, y:48`
- 大阪: `lat:34.6937, lon:135.5023` → `x:50, y:51`
- 福岡: `lat:33.5904, lon:130.4017` → `x:28, y:55`
- 愛知: `lat:35.1802, lon:136.9066` → `x:57, y:50`
- 兵庫: `lat:34.6913, lon:135.1830` → `x:48, y:50`

### 関数: `solve2Points(p1, p2)`

2点の基準データから連立方程式を解き、変換パラメータ（LAT_MIN, LAT_MAX, LON_MIN, LON_MAX）を求める。

**Y座標の方程式**:
```
y/100 = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN)
```
→ 2点で連立してクラメルの公式（行列式）で解く

**X座標の方程式**:
```
x/100 * LON_MAX + (1 - x/100) * LON_MIN = lon
```
→ 同様に2点で連立して解く

### 実行処理

1. 東京・北海道の2点で `solve2Points()` を呼び出してパラメータを計算
2. 計算結果（LAT_MIN, LAT_MAX, LON_MIN, LON_MAX）を `console.log()`
3. 全7基準点で計算値と期待値の誤差を検証して `console.log()`
4. 箱根温泉（lat:35.23385, lon:139.09555）でテスト計算して出力

このスクリプトは `node calibration.js` で実行するワンタイムツールであり、その計算結果が `_worker.ts` の `convertLatLonToXY()` の定数として使われている。

---

*以上、全ファイルの詳細リファレンス。*

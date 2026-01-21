# システムアーキテクチャ

このドキュメントでは、ブログアプリケーション全体の構成とファイル間の関係を図で説明します。

---

## 目次
1. [システム全体構成](#システム全体構成)
2. [ファイル依存関係](#ファイル依存関係)
3. [データフロー - 記事投稿](#データフロー---記事投稿)
4. [データフロー - 画像アップロード](#データフロー---画像アップロード)
5. [APIエンドポイント一覧](#apiエンドポイント一覧)
6. [コンポーネント構造](#コンポーネント構造)

---

## システム全体構成

```mermaid
graph TB
    subgraph "フロントエンド (React + Vite)"
        A[App.tsx]
        B[PostForm.tsx]
        C[PostDetailPage.tsx]
        D[CategoryPage.tsx]
        E[Profile.tsx]
        F[TitleCard.tsx]
    end

    subgraph "バックエンド (Cloudflare Workers + Hono)"
        G[_worker.ts]
    end

    subgraph "データベース & ストレージ"
        H[(Cloudflare D1<br/>postsテーブル)]
        I[Cloudflare R2<br/>IMAGE_BUCKET]
    end

    subgraph "外部ライブラリ"
        J[ReactMarkdown]
        K[SyntaxHighlighter]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    D --> F

    B -->|POST /api/post| G
    B -->|POST /api/upload-image| G
    C -->|GET /api/post/:id| G
    D -->|GET /api/post?category=...| G
    C -->|DELETE /api/post/:id| G

    G -->|Read/Write| H
    G -->|Upload/Get| I

    C --> J
    J --> K

    style A fill:#e1f5ff
    style G fill:#ffe1e1
    style H fill:#fff4e1
    style I fill:#e1ffe1
```

---

## ファイル依存関係

```mermaid
graph LR
    subgraph "エントリーポイント"
        Main[main.tsx]
    end

    subgraph "ルーティング"
        App[App.tsx]
    end

    subgraph "ページコンポーネント"
        PostForm[PostForm.tsx]
        PostDetail[PostDetailPage.tsx]
        Category[CategoryPage.tsx]
        Profile[Profile.tsx]
    end

    subgraph "共通コンポーネント"
        TitleCard[TitleCard.tsx]
    end

    subgraph "スタイル"
        IndexCSS[index.css]
        AppCSS[App.css]
    end

    subgraph "バックエンド"
        Worker[_worker.ts]
    end

    Main --> App
    Main --> IndexCSS

    App --> PostForm
    App --> PostDetail
    App --> Category
    App --> Profile
    App --> AppCSS

    Category --> TitleCard

    PostForm -.HTTP.-> Worker
    PostDetail -.HTTP.-> Worker
    Category -.HTTP.-> Worker

    style Main fill:#ff9999
    style App fill:#ffcc99
    style Worker fill:#99ccff
```

---

## データフロー - 記事投稿

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as PostForm.tsx
    participant Worker as _worker.ts
    participant D1 as Cloudflare D1
    participant R2 as Cloudflare R2

    User->>Form: 記事を入力（タイトル、本文、カテゴリ）
    User->>Form: アイキャッチ画像を選択（任意）
    User->>Form: パスワード入力
    User->>Form: 投稿ボタンクリック

    Form->>Form: FormDataを作成
    Note over Form: title, content, category,<br/>image, password

    Form->>Worker: POST /api/post

    Worker->>Worker: パスワード認証

    alt 画像ファイルあり
        Worker->>R2: 画像をアップロード<br/>(タイムスタンプ-ファイル名)
        R2-->>Worker: 画像URL
    end

    Worker->>D1: INSERT INTO posts
    Note over D1: title, category,<br/>image_url, content,<br/>created_at

    D1-->>Worker: 挿入成功
    Worker->>D1: SELECT * WHERE id=?
    D1-->>Worker: 投稿データ

    Worker-->>Form: 201 Created + 投稿データ
    Form-->>User: 投稿成功メッセージ
```

---

## データフロー - 画像アップロード

### /imageコマンドによる画像挿入

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Form as PostForm.tsx
    participant Worker as _worker.ts
    participant R2 as Cloudflare R2

    User->>Form: 本文入力中に「/image」と入力
    Form->>Form: コマンド候補を表示

    User->>Form: Enterキーまたはクリック
    Form->>Form: handleInsertImage()実行
    Form->>Form: 非表示のinput要素をクリック

    Note over Form: hiddenImageInputRef.current?.click()

    Form-->>User: ファイル選択ダイアログを表示
    User->>Form: 画像ファイルを選択

    Form->>Form: handleContentImageSelect()実行
    Form->>Form: FormDataを作成
    Note over Form: { image: File }

    Form->>Worker: POST /api/upload-image<br/>(パスワード不要)

    Worker->>R2: 画像をアップロード<br/>(タイムスタンプ-ファイル名)
    R2-->>Worker: 画像URL

    Worker-->>Form: 200 OK + { image_url }

    Form->>Form: マークダウン記法を生成<br/>![ファイル名](画像URL)
    Form->>Form: カーソル位置に挿入

    Form-->>User: 本文に画像マークダウンが挿入される
```

---

## APIエンドポイント一覧

```mermaid
graph TB
    subgraph "APIエンドポイント (_worker.ts)"
        API1[POST /api/post<br/>記事投稿]
        API2[GET /api/post<br/>記事一覧取得]
        API3[GET /api/post/:id<br/>記事詳細取得]
        API4[DELETE /api/post/:id<br/>記事削除]
        API5[POST /api/upload-image<br/>画像アップロード]
    end

    subgraph "認証"
        Auth1[パスワード必要]
        Auth2[パスワード不要]
    end

    subgraph "データベース操作"
        DB1[INSERT]
        DB2[SELECT]
        DB3[DELETE]
    end

    subgraph "ストレージ操作"
        S1[R2 Upload]
    end

    API1 --> Auth1
    API1 --> DB1
    API1 -.画像ありの場合.-> S1

    API2 --> Auth2
    API2 --> DB2

    API3 --> Auth2
    API3 --> DB2

    API4 --> Auth1
    API4 --> DB3

    API5 --> Auth2
    API5 --> S1

    style API1 fill:#ffcccc
    style API2 fill:#ccffcc
    style API3 fill:#ccffcc
    style API4 fill:#ffcccc
    style API5 fill:#ccccff
    style Auth1 fill:#ff9999
    style Auth2 fill:#99ff99
```

### エンドポイント詳細

| エンドポイント | メソッド | 認証 | 説明 | 実装ファイル |
|--------------|---------|------|------|------------|
| `/api/post` | POST | ✅ 必要 | 記事を投稿（画像も含む） | `_worker.ts:62` |
| `/api/post` | GET | ❌ 不要 | 記事一覧を取得（カテゴリ絞り込み可） | `_worker.ts:127` |
| `/api/post/:id` | GET | ❌ 不要 | 特定の記事を取得 | `_worker.ts:159` |
| `/api/post/:id` | DELETE | ✅ 必要 | 記事を削除 | `_worker.ts:185` |
| `/api/upload-image` | POST | ❌ 不要 | 画像のみをアップロード | `_worker.ts:230` |

---

## コンポーネント構造

```mermaid
graph TB
    subgraph "App.tsx - ルートコンポーネント"
        Router[BrowserRouter]
    end

    subgraph "ページ"
        Home[ホームページ<br/>CategoryPage]
        Post[記事詳細<br/>PostDetailPage]
        Form[投稿フォーム<br/>PostForm]
        Prof[プロフィール<br/>Profile]
    end

    subgraph "共通コンポーネント"
        Card[記事カード<br/>TitleCard]
        Header[ヘッダー<br/>(sticky)]
    end

    subgraph "外部ライブラリ"
        RM[ReactMarkdown]
        SH[SyntaxHighlighter]
    end

    Router --> Home
    Router --> Post
    Router --> Form
    Router --> Prof

    Home --> Card
    Router --> Header

    Post --> RM
    RM --> SH

    style Router fill:#e1f5ff
    style Home fill:#ffe1e1
    style Post fill:#ffe1e1
    style Form fill:#ffe1e1
    style Prof fill:#ffe1e1
    style Card fill:#fff4e1
    style Header fill:#fff4e1
```

---

## データベーススキーマ

```mermaid
erDiagram
    posts {
        INTEGER id PK "主キー（自動採番）"
        TEXT title "記事タイトル"
        TEXT category "カテゴリ名"
        TEXT image_url "アイキャッチ画像URL（NULL可）"
        TEXT content "記事本文（マークダウン）"
        TEXT created_at "作成日時（ISO 8601）"
    }
```

### postsテーブル

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| `id` | INTEGER | PRIMARY KEY | 自動採番される一意のID |
| `title` | TEXT | NOT NULL | 記事のタイトル（最大30文字） |
| `category` | TEXT | NOT NULL | カテゴリ（温泉、料理、ねこ、技術、日常） |
| `image_url` | TEXT | NULL | アイキャッチ画像のURL（R2） |
| `content` | TEXT | NOT NULL | 記事本文（マークダウン形式） |
| `created_at` | TEXT | NOT NULL | 作成日時（ISO 8601形式） |

---

## スラッシュコマンドの処理フロー

```mermaid
stateDiagram-v2
    [*] --> 通常入力モード

    通常入力モード --> コマンド検知: /を入力
    コマンド検知 --> コマンドモード: スペースなし
    コマンド検知 --> 通常入力モード: スペースあり

    コマンドモード --> 候補表示: 候補をフィルタリング
    候補表示 --> 選択中: ↑↓キーで移動

    選択中 --> コマンド実行: Enter/クリック
    選択中 --> 通常入力モード: Escape
    選択中 --> 候補表示: 文字入力で絞り込み

    コマンド実行 --> アクション実行: コマンド文字列を削除

    アクション実行 --> 画像選択: /imageの場合
    アクション実行 --> テキスト挿入: /code, /linkの場合

    画像選択 --> 画像アップロード: ファイル選択
    画像アップロード --> テキスト挿入: URLを取得

    テキスト挿入 --> 通常入力モード: カーソル位置に挿入
```

---

## 環境変数とバインディング

```mermaid
graph TB
    subgraph "Cloudflare環境変数"
        ENV1[DB<br/>D1Database]
        ENV2[IMAGE_BUCKET<br/>R2Bucket]
        ENV3[R2_PUBLIC_URL<br/>string]
        ENV4[SECRET_KEY<br/>string]
    end

    subgraph "_worker.ts"
        Worker[Honoアプリケーション]
    end

    subgraph "利用箇所"
        U1[記事の保存・取得・削除]
        U2[画像のアップロード]
        U3[画像URLの生成]
        U4[パスワード認証]
    end

    ENV1 --> Worker
    ENV2 --> Worker
    ENV3 --> Worker
    ENV4 --> Worker

    Worker --> U1
    Worker --> U2
    Worker --> U3
    Worker --> U4

    U1 -.使用.-> ENV1
    U2 -.使用.-> ENV2
    U3 -.使用.-> ENV3
    U4 -.使用.-> ENV4
```

### 環境変数一覧

| 変数名 | 型 | 説明 | 使用箇所 |
|--------|-----|------|---------|
| `DB` | D1Database | Cloudflare D1データベース | 記事のCRUD操作 |
| `IMAGE_BUCKET` | R2Bucket | Cloudflare R2バケット | 画像の保存 |
| `R2_PUBLIC_URL` | string | R2の公開URL | 画像URLの生成 |
| `SECRET_KEY` | string | 管理者パスワード | 投稿・削除時の認証 |

---

## ファイル一覧とその役割

### フロントエンド

| ファイル | 役割 | 主な機能 |
|---------|------|---------|
| `src/main.tsx` | エントリーポイント | Reactアプリのマウント |
| `src/App.tsx` | ルートコンポーネント | ルーティング、ヘッダー |
| `src/components/PostForm.tsx` | 投稿フォーム | 記事投稿、スラッシュコマンド |
| `src/components/PostDetailPage.tsx` | 記事詳細ページ | マークダウン表示、削除機能 |
| `src/components/CategoryPage.tsx` | カテゴリページ | 記事一覧、カテゴリフィルタ |
| `src/components/Profile.tsx` | プロフィールページ | 自己紹介表示 |
| `src/category/title_card.tsx` | 記事カード | 記事カードコンポーネント |
| `src/index.css` | グローバルCSS | 全体のスタイル定義 |
| `src/App.css` | App用CSS | Appコンポーネントのスタイル |

### バックエンド

| ファイル | 役割 | 主な機能 |
|---------|------|---------|
| `_worker.ts` | Cloudflare Workers | 全APIエンドポイント |
| `functions/api/post.ts` | （未使用） | 古いアーキテクチャの残骸 |

### 設定ファイル

| ファイル | 役割 |
|---------|------|
| `package.json` | 依存パッケージ管理 |
| `tsconfig.json` | TypeScript設定 |
| `vite.config.ts` | Vite設定 |
| `wrangler.toml` | Cloudflare Workers設定 |

---

## 技術スタック

```mermaid
graph LR
    subgraph "フロントエンド"
        F1[React 19]
        F2[TypeScript 5.8]
        F3[Vite 7]
        F4[React Router 7]
        F5[ReactMarkdown]
        F6[Tailwind CSS]
    end

    subgraph "バックエンド"
        B1[Cloudflare Workers]
        B2[Hono 4]
        B3[Cloudflare D1]
        B4[Cloudflare R2]
    end

    subgraph "開発ツール"
        D1[ESLint]
        D2[Wrangler CLI]
        D3[esbuild]
    end

    style F1 fill:#61dafb
    style B1 fill:#f38020
    style B3 fill:#f6821f
    style B4 fill:#f6821f
```

---

## デプロイメントフロー

```mermaid
sequenceDiagram
    actor Dev as 開発者
    participant Local as ローカル環境
    participant Git as GitHub
    participant CF as Cloudflare Pages
    participant D1 as Cloudflare D1
    participant R2 as Cloudflare R2

    Dev->>Local: コードを編集
    Dev->>Local: npm run build
    Note over Local: Viteでビルド<br/>esbuildでWorkerビルド

    Dev->>Git: git push

    Git->>CF: Webhook通知
    CF->>CF: 自動ビルド
    CF->>CF: デプロイ

    Note over CF,D1: D1とR2は<br/>既に設定済み

    CF-->>Dev: デプロイ完了通知
```

---

**最終更新**: 2026-01-19

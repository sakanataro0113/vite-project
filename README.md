# ブログアプリケーション

React + TypeScript + Vite + Cloudflare Workers (Hono) で構築されたブログアプリケーションです。

## プロジェクト概要

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Cloudflare Workers + Hono
- **データベース**: Cloudflare D1
- **ストレージ**: Cloudflare R2
- **マークダウン**: ReactMarkdown

## 機能

- 記事の投稿・一覧表示・詳細表示
- カテゴリ別フィルタリング
- アイキャッチ画像のアップロード（R2）
- **本文中の画像挿入（/imageコマンド）** ✨ NEW
  - スラッシュコマンド機能で簡単に画像を挿入
  - パスワード不要で画像をR2にアップロード
  - 自動的にマークダウン記法を挿入
- マークダウン記法のサポート
- コードのシンタックスハイライト
- 記事の削除（パスワード認証）

## ドキュメント

プロジェクトの機能やコードの詳細は `docs/` ディレクトリにまとめられています。

### ドキュメント一覧
- **[システムアーキテクチャ](docs/system-architecture.md)** - システム全体の構成とファイル間の関係を図で解説 ⭐ おすすめ
- [画像機能の解説](docs/image-feature.md) - アイキャッチ画像とマークダウン内画像の仕組み
- [スラッシュコマンド機能](docs/slash-commands.md) - `/image`などのコマンド入力機能の解説
- [スラッシュコマンド機能 - 超詳細解説](docs/slash-commands-detailed.md) - React/JavaScriptの基礎から詳しく解説（初心者向け）

### ドキュメント作成ルール

**重要**: コードに機能追加や変更を行った際は、必ず `docs/` ディレクトリに機能ごとのドキュメントを作成してください。

**ドキュメントに含めるべき内容**:
1. 機能の概要と目的
2. 実装の詳細（コードの場所とファイル名:行番号）
3. 使用方法
4. データベーススキーマ（該当する場合）
5. 関連ファイル一覧
6. 今後の改善案（あれば）
7. 最終更新日

**ファイル命名規則**:
- 機能名を英語で記述（例: `image-feature.md`, `auth-system.md`）
- ケバブケース（小文字＋ハイフン）を使用

## 開発環境のセットアップ

### 前提条件
- Node.js (推奨: v18以上)
- Cloudflareアカウント
- Wrangler CLI

### インストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

## Viteについて

このプロジェクトはViteを使用しています。以下の公式プラグインが利用可能です：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 最近の更新

### 2026-01-19
- **専用の画像アップロードAPI実装**
  - `POST /api/upload-image` エンドポイントを追加
  - パスワード不要で画像のみをアップロード可能に
  - 仮投稿を経由する方式から変更してシンプル化
- **画像表示スタイルの改善**
  - 本文中の画像（ReactMarkdownで生成）にも`article-image`クラスを適用
  - スマホ・PCで適切な幅で表示されるように修正
  - アイキャッチ画像と本文中の画像で統一されたスタイル
- **ドキュメントの充実**
  - スラッシュコマンド機能の超詳細解説を追加（初心者向け）
  - React/JavaScriptの基礎から丁寧に説明

### 画像の保存方法
- **保存先**: Cloudflare R2（IMAGE_BUCKET）
- **ファイル名**: `${タイムスタンプ}-${元のファイル名}`
- **アイキャッチ画像**: `POST /api/post`経由でアップロード
- **本文中の画像**: `POST /api/upload-image`経由でアップロード
- 両方とも同じR2バケットに保存され、同じ形式のURLが生成されます

---

**最終更新**: 2026-01-19

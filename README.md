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
- マークダウン記法のサポート
- コードのシンタックスハイライト
- 記事の削除（パスワード認証）

## ドキュメント

プロジェクトの機能やコードの詳細は `docs/` ディレクトリにまとめられています。

### ドキュメント一覧
- [画像機能の解説](docs/image-feature.md) - アイキャッチ画像とマークダウン内画像の仕組み
- [スラッシュコマンド機能](docs/slash-commands.md) - `/image`などのコマンド入力機能の解説

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

# 画像機能の解説

## 概要
このドキュメントでは、記事投稿における画像機能について説明します。
現在、2つの画像表示方法があります：
1. アイキャッチ画像（記事の最初に1枚）
2. マークダウン内の画像（本文中に複数枚）

---

## 1. 現在の画像機能（アイキャッチ画像）

### 1.1 フロントエンド実装
**ファイル**: `src/components/PostForm.tsx:53-67`

```tsx
<input
    id="image-upload"
    type="file"
    accept="image/*"
    onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    }}
/>
```

**機能**:
- アイキャッチ画像として1枚の画像ファイルを選択
- `imageFile`というReact stateで管理
- `accept="image/*"`で画像ファイルのみ選択可能

### 1.2 送信処理
**ファイル**: `src/components/PostForm.tsx:22-25`

```tsx
if (imageFile) {
    formData.append('image', imageFile);
}
```

**機能**:
- FormDataオブジェクトに画像ファイルを追加
- 画像が選択されている場合のみ送信

### 1.3 バックエンド処理
**ファイル**: `_worker.ts:86-94`

```typescript
if(imageFile instanceof File && imageFile.size > 0){
    const imageBuffer = await imageFile.arrayBuffer();
    const fileName = `${Date.now()}-${imageFile.name}`;
    await c.env.IMAGE_BUCKET.put(fileName, imageBuffer);

    const r2PublicUrl = c.env.R2_PUBLIC_URL;
    image_url = `${r2PublicUrl}/${fileName}`;
}
```

**機能**:
- 画像ファイルをCloudflare R2バケットに保存
- ユニークなファイル名を生成（`タイムスタンプ-元のファイル名`）
- 公開URLを生成してデータベースの`image_url`カラムに保存

**環境変数**:
- `IMAGE_BUCKET`: R2バケットのバインディング
- `R2_PUBLIC_URL`: R2の公開URL（例: https://pub-xxxxx.r2.dev）

### 1.4 表示処理
**ファイル**: `src/components/PostDetailPage.tsx:63-71`

```tsx
{post.image_url && (
    <div className="w-full my-4">
        <img
            src={post.image_url}
            alt={post.title}
            className='article-image'
        />
    </div>
)}
```

**機能**:
- 記事タイトルの下に画像を表示
- `image_url`が存在する場合のみレンダリング

**ファイル**: `src/category/title_card.tsx:68-74`

```tsx
{post.image_url && (
    <img
        src={post.image_url}
        alt={post.title}
        className='article-image'
    />
)}
```

**機能**:
- 記事一覧カードにもアイキャッチ画像を表示

---

## 2. マークダウン内の画像機能

### 2.1 実装状況
**ファイル**: `src/components/PostDetailPage.tsx:73-96`

```tsx
<ReactMarkdown
    remarkPlugins={[remarkBreaks]}
    components={{
        code(props) {
            // コードブロックのカスタマイズ
        }
    }}
>
    {post.content}
</ReactMarkdown>
```

**機能**:
- `ReactMarkdown`コンポーネントがマークダウンを自動的にHTMLに変換
- 画像記法 `![alt](url)` を `<img>` タグに変換
- **追加のコード変更なしで既に使用可能**

### 2.2 使用方法
記事の本文（`content`フィールド）にマークダウン記法で画像を挿入：

```markdown
これは本文の最初の段落です。

![温泉の写真](https://example.com/onsen.jpg)

画像の後にも文章を書けます。

![別の写真](https://example.com/photo2.jpg)

複数枚の画像を挿入できます。
```

### 2.3 画像URLの取得方法

#### 方法1: スラッシュコマンド（/image）✨ **おすすめ**
**ファイル**: `src/components/PostForm.tsx`

本文入力中に `/image` と入力すると、オートコンプリート候補が表示されます。

```
本文を入力中...
↓
/image と入力
↓
📷 画像を挿入 ← Enterまたはクリック
↓
ファイル選択ダイアログが開く
↓
画像を選択
↓
自動的にR2にアップロード
↓
カーソル位置に ![](https://...) が挿入される
```

**操作方法**:
- `↑` `↓` キーでコマンド選択
- `Enter` キーで実行
- `Esc` キーでキャンセル

**詳細**: [スラッシュコマンド機能のドキュメント](./slash-commands.md)

#### 方法2: 外部URLを使用
既にホストされている画像のURLを直接使用

```markdown
![説明](https://your-r2-bucket.com/image.jpg)
```

#### 方法3: R2にアップロードしたURLを手動で使用
1. アイキャッチ画像のアップロード機能を利用
2. 生成されたR2のURLをコピー
3. マークダウン記法で本文に貼り付け

---

## 3. データベーススキーマ

### postsテーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INTEGER | 主キー（自動採番） |
| title | TEXT | 記事タイトル |
| category | TEXT | カテゴリ名 |
| image_url | TEXT | アイキャッチ画像のURL（NULL可） |
| content | TEXT | 記事本文（マークダウン形式） |
| created_at | TEXT | 作成日時（ISO 8601形式） |

---

## 4. 機能比較

| 項目 | アイキャッチ画像 | マークダウン内画像（スラッシュコマンド） | マークダウン内画像（手動） |
|------|----------------|--------------------------------|---------------------|
| 表示位置 | 記事の最初のみ | 本文の好きな位置 | 本文の好きな位置 |
| 枚数 | 1枚のみ | 複数可能 | 複数可能 |
| 保存場所 | `image_url`カラム | `content`カラム内 | `content`カラム内 |
| 入力方法 | ファイル選択UI | `/image`コマンド | マークダウン記法を手動入力 |
| アップロード | 自動（R2） | 自動（R2） | 手動でURLを取得 |
| 操作性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 既存の実装 | 完全実装済み | 完全実装済み（2026-01-19） | 表示機能のみ実装済み |

---

## 5. 関連ファイル

### フロントエンド
- `src/components/PostForm.tsx` - 投稿フォーム
- `src/components/PostDetailPage.tsx` - 記事詳細ページ
- `src/category/title_card.tsx` - 記事一覧カード

### バックエンド
- `_worker.ts` - Cloudflare Workers（Hono）
- `functions/api/post.ts` - 投稿API（※現在未使用、_worker.tsに統合済み）

### 依存パッケージ
- `react-markdown` - マークダウンレンダリング
- `remark-breaks` - 改行を`<br>`に変換
- `react-syntax-highlighter` - コードハイライト

---

## 6. スラッシュコマンド機能の実装（2026-01-19追加）

`/image`コマンドにより、本文入力中に簡単に画像を挿入できるようになりました。

**実装の詳細**: [slash-commands.md](./slash-commands.md)

**主な機能**:
- `/image` でファイル選択ダイアログを開く
- 自動的にR2にアップロード
- カーソル位置にマークダウン記法を自動挿入
- キーボード操作対応（↑↓でコマンド選択、Enterで実行）

---

## 7. 今後の改善案

1. **専用の画像アップロードAPI** ⭐ 優先度高
   - 現在は仮投稿を経由する方式
   - 専用APIを作成してよりシンプルに

2. **ドラッグ&ドロップ対応**
   - 本文エリアに直接画像をドロップ
   - 自動アップロード＆マークダウン挿入

3. **クリップボード貼り付け**
   - `Cmd+V`でスクリーンショットを直接貼り付け
   - 自動アップロード＆挿入

4. **画像のリサイズ・最適化**
   - R2アップロード前にクライアント側でリサイズ
   - WebP形式への変換

5. **画像ギャラリー機能**
   - 過去にアップロードした画像一覧
   - 画像の再利用

6. **リアルタイムプレビュー**
   - 本文エリアとプレビューの分割表示
   - 画像が実際にどう見えるか確認できる

---

**最終更新**: 2026-01-19

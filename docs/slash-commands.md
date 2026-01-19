# スラッシュコマンド機能

## 概要
記事投稿フォームの本文入力エリアで `/` を入力すると、Claude Codeのようなオートコンプリート候補が表示され、画像挿入やコードブロックなどを簡単に挿入できる機能です。

---

## 使い方

### 基本的な操作

1. **本文入力エリアで `/` を入力**
   - コマンド候補のポップアップが表示される

2. **コマンドを選択**
   - 方法1: `↑` `↓` キーで選択 → `Enter` で実行
   - 方法2: マウスでクリック
   - キャンセル: `Esc` キー

3. **候補を絞り込み**
   - `/image` のように続けて入力すると候補が絞り込まれる

### 利用可能なコマンド

| コマンド | アイコン | 説明 | 動作 |
|---------|---------|------|------|
| `/image` | 📷 | 画像を挿入 | ファイル選択ダイアログを開き、選択した画像をR2にアップロード後、`![](url)`を挿入 |
| `/code` | 💻 | コードブロック | ` ```\n\n``` ` を挿入 |
| `/link` | 🔗 | リンク | `[リンクテキスト](URL)` を挿入 |

---

## 実装の詳細

### 1. 状態管理
**ファイル**: `src/components/PostForm.tsx:17-20`

```tsx
const [showCommands, setShowCommands] = useState(false);
const [commandSearch, setCommandSearch] = useState("");
const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
const [cursorPosition, setCursorPosition] = useState(0);
```

**機能**:
- `showCommands`: コマンド候補の表示/非表示
- `commandSearch`: 入力されたコマンド文字列（例: "/image"）
- `selectedCommandIndex`: 現在選択されているコマンドのインデックス
- `cursorPosition`: テキストエリアのカーソル位置

### 2. コマンド定義
**ファイル**: `src/components/PostForm.tsx:73-93`

```tsx
type Command = {
    trigger: string;      // コマンドのトリガー文字列
    label: string;        // 表示用ラベル
    description: string;  // 説明文
    icon: string;         // アイコン（絵文字）
    action: () => void;   // 実行される関数
};

const commands: Command[] = [
    {
        trigger: '/image',
        label: '画像を挿入',
        description: '画像ファイルを選択してアップロード',
        icon: '📷',
        action: handleInsertImage,
    },
    // ...
];
```

**拡張性**:
- 新しいコマンドを追加する場合は、この配列に要素を追加するだけ

### 3. 入力検知
**ファイル**: `src/components/PostForm.tsx:98-118`

```tsx
const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(newContent);
    setCursorPosition(cursorPos);

    // スラッシュコマンドの検知
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
        const textAfterSlash = textBeforeCursor.substring(lastSlashIndex);
        // スラッシュの後にスペースや改行がない場合のみコマンドモード
        if (!/\s/.test(textAfterSlash)) {
            setCommandSearch(textAfterSlash);
            setShowCommands(true);
            setSelectedCommandIndex(0);
            return;
        }
    }

    setShowCommands(false);
    setCommandSearch("");
};
```

**動作**:
1. カーソル位置より前のテキストから最後の `/` を検索
2. `/` の後にスペースや改行がなければコマンドモードON
3. `/` 以降の文字列で候補をフィルタリング

### 4. キーボード操作
**ファイル**: `src/components/PostForm.tsx:120-144`

```tsx
const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showCommands) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(filteredCommands[selectedCommandIndex]);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommands(false);
        setCommandSearch("");
    }
};
```

**サポートするキー**:
- `↑` / `↓`: コマンド候補の選択
- `Enter`: コマンドの実行
- `Esc`: コマンドモードのキャンセル

### 5. コマンド実行
**ファイル**: `src/components/PostForm.tsx:146-170`

```tsx
const executeCommand = (command: Command) => {
    if (!command) return;

    // コマンド文字列を削除
    const textarea = contentInputRef.current;
    if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = content.substring(0, cursorPos);
        const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

        if (lastSlashIndex !== -1) {
            const newContent = content.substring(0, lastSlashIndex) + content.substring(cursorPos);
            setContent(newContent);

            // カーソル位置を調整
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = lastSlashIndex;
                textarea.focus();
            }, 0);
        }
    }

    setShowCommands(false);
    setCommandSearch("");
    command.action();
};
```

**動作**:
1. 入力された `/image` などのコマンド文字列を削除
2. カーソル位置を調整
3. コマンドに紐づいたアクション関数を実行

### 6. 画像アップロード処理
**ファイル**: `src/components/PostForm.tsx:30-44`

```tsx
const uploadImageForContent = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
    });

    if (res.ok) {
        const data = await res.json() as { success: boolean; image_url?: string };
        return data.image_url || '';
    }
    throw new Error('画像のアップロードに失敗しました');
};
```

**仕組み**:
1. 画像ファイルをFormDataに追加
2. 専用の`/api/upload-image`エンドポイントに送信
3. R2に画像がアップロードされ、URLが返される
4. 画像URLを返す

**特徴**: パスワード不要で画像をアップロードできます。記事投稿時のパスワード認証があるため、セキュリティ上問題ありません。

### 7. テキスト挿入処理
**ファイル**: `src/components/PostForm.tsx:66-80`

```tsx
const insertTextAtCursor = (text: string) => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);

    // カーソル位置を挿入したテキストの後ろに移動
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }, 0);
};
```

**動作**:
1. 現在のカーソル位置（選択範囲）を取得
2. その位置にテキストを挿入
3. カーソルを挿入したテキストの末尾に移動

### 8. UI実装
**ファイル**: `src/components/PostForm.tsx:202-237`

```tsx
{showCommands && filteredCommands.length > 0 && (
    <div className="absolute z-10 bg-white border rounded-lg shadow-lg p-2 mt-1 w-80">
        <div className="text-xs text-gray-500 mb-2 px-2">コマンド候補</div>
        {filteredCommands.map((cmd, index) => (
            <button
                key={cmd.trigger}
                type="button"
                onClick={() => executeCommand(cmd)}
                className={`w-full text-left px-3 py-2 rounded flex items-start gap-3 ${
                    index === selectedCommandIndex
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                }`}
            >
                <span className="text-xl">{cmd.icon}</span>
                <div className="flex-1">
                    <div className="font-medium">{cmd.trigger}</div>
                    <div className="text-sm text-gray-600">{cmd.description}</div>
                </div>
            </button>
        ))}
        <div className="text-xs text-gray-400 mt-2 px-2">
            ↑↓: 選択 | Enter: 実行 | Esc: キャンセル
        </div>
    </div>
)}
```

**デザイン**:
- 選択中のコマンドは青い背景 (`bg-blue-100`)
- ホバー時は灰色の背景 (`hover:bg-gray-100`)
- 絶対配置でテキストエリアの下に表示
- キーボードショートカットのヒントを表示

---

## 今後の拡張案

### 1. 追加コマンド候補

```tsx
{
    trigger: '/quote',
    label: '引用',
    description: '引用ブロックを挿入',
    icon: '📝',
    action: () => insertTextAtCursor('\n> \n'),
},
{
    trigger: '/table',
    label: 'テーブル',
    description: 'マークダウンテーブルを挿入',
    icon: '📊',
    action: () => insertTextAtCursor('\n| 列1 | 列2 |\n|-----|-----|\n| 値1 | 値2 |\n'),
},
{
    trigger: '/date',
    label: '今日の日付',
    description: '現在の日付を挿入',
    icon: '📅',
    action: () => insertTextAtCursor(new Date().toLocaleDateString('ja-JP')),
},
```

### 2. コマンドのカテゴリ分け

```tsx
const commandCategories = {
    media: ['/image', '/video'],
    formatting: ['/code', '/quote', '/table'],
    insert: ['/link', '/date', '/emoji'],
};
```

### 3. カスタムパラメータ対応

```
/code python
↓
\`\`\`python

\`\`\`
```

### 4. 専用の画像アップロードAPI

**ファイル**: `_worker.ts`

```typescript
app.post('/api/upload-image', async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image');

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return c.json({ success: false, error: 'No image provided' }, 400);
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const fileName = `${Date.now()}-${imageFile.name}`;
    await c.env.IMAGE_BUCKET.put(fileName, imageBuffer);

    const image_url = `${c.env.R2_PUBLIC_URL}/${fileName}`;
    return c.json({ success: true, image_url });

  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to upload image' }, 500);
  }
});
```

**特徴**:
- パスワード不要で画像のみをアップロード
- シンプルで効率的
- 記事投稿時のパスワード認証により、セキュリティは保たれる

### 5. ポップアップ位置の最適化

現在は常にテキストエリアの下に表示されますが、カーソル位置に基づいて動的に位置を計算することで、より使いやすくなります。

---

## 関連ファイル

### フロントエンド
- `src/components/PostForm.tsx` - メインの実装ファイル

### バックエンド
- `_worker.ts` - 画像アップロードAPI（仮投稿経由）

### 依存パッケージ
- React (useState, useRef, useEffect)
- Tailwind CSS（スタイリング）

---

## トラブルシューティング

### 画像アップロードに失敗する
- パスワードが正しく設定されているか確認
- R2バケットとR2_PUBLIC_URLの設定を確認
- ブラウザのコンソールでエラーメッセージを確認

### コマンド候補が表示されない
- `/` の後にスペースが入っていないか確認
- ブラウザのコンソールでJavaScriptエラーがないか確認

### キーボード操作が効かない
- テキストエリアにフォーカスがあるか確認
- 他のブラウザ拡張機能とのキーバインド競合を確認

---

**最終更新**: 2026-01-19

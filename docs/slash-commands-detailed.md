# スラッシュコマンド機能 - 超詳細解説

## 目次
1. [全体の仕組み](#全体の仕組み)
2. [React基礎知識](#react基礎知識)
3. [状態管理の詳細](#状態管理の詳細)
4. [入力検知の仕組み](#入力検知の仕組み)
5. [キーボード操作の実装](#キーボード操作の実装)
6. [コマンド実行の流れ](#コマンド実行の流れ)
7. [画像アップロードの詳細](#画像アップロードの詳細)
8. [テキスト挿入の仕組み](#テキスト挿入の仕組み)

---

## 全体の仕組み

### 動作フロー

```
1. ユーザーがテキストエリアで `/` を入力
   ↓
2. onChange イベントが発火
   ↓
3. handleContentChange 関数が実行される
   ↓
4. カーソル位置より前のテキストを解析
   ↓
5. `/` の後にスペースがなければコマンドモードON
   ↓
6. コマンド候補のポップアップを表示
   ↓
7. ユーザーが↑↓キーで選択 または マウスでクリック
   ↓
8. Enter キーまたはクリックでコマンド実行
   ↓
9. executeCommand 関数が実行される
   ↓
10. コマンド文字列（`/image`など）を削除
   ↓
11. コマンドのaction関数を実行（画像選択など）
```

---

## React基礎知識

### useState とは？

**役割**: コンポーネント内で「変化する値」を管理するための仕組み

```tsx
const [変数名, 変数を変更する関数] = useState(初期値);
```

**具体例**:
```tsx
const [content, setContent] = useState("");
```

- `content`: 現在の本文の内容を保持する変数
- `setContent`: `content`の値を変更するための関数
- `""`: 初期値（空文字列）

**なぜ普通の変数ではダメなのか？**
```tsx
// ❌ これだと画面が更新されない
let content = "";
content = "新しい値";

// ✅ useState を使うと画面が自動的に更新される
const [content, setContent] = useState("");
setContent("新しい値"); // 画面が再レンダリングされる
```

### useRef とは？

**役割**: DOM要素への参照を保持する

```tsx
const 参照名 = useRef<要素の型>(null);
```

**具体例**:
```tsx
const contentInputRef = useRef<HTMLTextAreaElement>(null);

// JSXで使用
<textarea ref={contentInputRef} />

// 後で要素を操作できる
contentInputRef.current?.focus(); // テキストエリアにフォーカス
contentInputRef.current?.selectionStart; // カーソル位置を取得
```

**なぜ必要なのか？**
- React では直接 `document.getElementById()` などを使わない
- `useRef` を使うことで、React の管理下で DOM 要素にアクセスできる

---

## 状態管理の詳細

### 各状態の役割

```tsx
const [showCommands, setShowCommands] = useState(false);
```
- **役割**: コマンド候補のポップアップを表示するか
- **型**: `boolean`（true または false）
- **初期値**: `false`（非表示）
- **使用場所**: UIの条件付きレンダリング
  ```tsx
  {showCommands && <div>コマンド候補</div>}
  ```

```tsx
const [commandSearch, setCommandSearch] = useState("");
```
- **役割**: 現在入力されているコマンド文字列を保持
- **型**: `string`
- **初期値**: `""`（空文字列）
- **例**: ユーザーが `/im` と入力した場合、`commandSearch` は `"/im"` になる

```tsx
const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
```
- **役割**: 現在選択されているコマンドのインデックス（何番目か）
- **型**: `number`
- **初期値**: `0`（最初のコマンドを選択）
- **例**: コマンドが3つある場合、0, 1, 2 のいずれか

```tsx
const contentInputRef = useRef<HTMLTextAreaElement>(null);
```
- **役割**: テキストエリアのDOM要素への参照
- **型**: `RefObject<HTMLTextAreaElement>`
- **使用例**: カーソル位置の取得・設定、フォーカス操作

```tsx
const hiddenImageInputRef = useRef<HTMLInputElement>(null);
```
- **役割**: 非表示の画像選択input要素への参照
- **型**: `RefObject<HTMLInputElement>`
- **使用例**: プログラムから画像選択ダイアログを開く
  ```tsx
  hiddenImageInputRef.current?.click(); // ファイル選択を開く
  ```

---

## 入力検知の仕組み

### handleContentChange 関数の詳細

```tsx
const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(newContent);
    setCursorPosition(cursorPos);

    const textBeforeCursor = newContent.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
        const textAfterSlash = textBeforeCursor.substring(lastSlashIndex);
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

### ステップごとの解説

#### ステップ1: イベントオブジェクトから情報を取得

```tsx
const newContent = e.target.value;
```
- **`e`**: イベントオブジェクト（ユーザーの入力情報を含む）
- **`e.target`**: イベントが発生した要素（この場合はtextarea）
- **`e.target.value`**: テキストエリアの全文
- **例**: ユーザーが `"こんにちは/image"` と入力した場合、`newContent` は `"こんにちは/image"`

```tsx
const cursorPos = e.target.selectionStart;
```
- **`selectionStart`**: カーソルの位置（文字列の何文字目か）
- **型**: `number`
- **例**: `"こんにちは/image"` の `/` の位置は5文字目なので、`/` の直後なら `cursorPos` は 6

#### ステップ2: 状態を更新

```tsx
setContent(newContent);
setCursorPosition(cursorPos);
```
- 入力された内容とカーソル位置を state に保存
- これにより画面が更新される

#### ステップ3: カーソルより前のテキストを抽出

```tsx
const textBeforeCursor = newContent.substring(0, cursorPos);
```

**`substring(開始位置, 終了位置)` とは？**
- 文字列の一部を切り出すメソッド
- **開始位置**: 含む
- **終了位置**: 含まない

**例**:
```tsx
const text = "こんにちは/image";
const cursorPos = 11; // 最後の位置
const result = text.substring(0, 11);
// result = "こんにちは/image"（最初から11文字目の前まで）

const text2 = "こんにちは/image";
const cursorPos2 = 6; // `/` の直後
const result2 = text2.substring(0, 6);
// result2 = "こんにちは/"
```

**なぜカーソルより前だけを見るのか？**
- カーソルより後ろの文字はコマンド入力に関係ない
- 例: `"こんにちは/image 後ろの文字"` でカーソルが `/image` の直後にあるとき、`" 後ろの文字"` は無視する

#### ステップ4: 最後の `/` を探す

```tsx
const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
```

**`lastIndexOf(検索文字)` とは？**
- 文字列の中で、指定した文字が**最後に**出現する位置を返す
- 見つからない場合は `-1` を返す

**例**:
```tsx
const text = "こんにちは/image";
const index = text.lastIndexOf('/');
// index = 5（0から数えて5番目）

const text2 = "スラッシュなし";
const index2 = text2.lastIndexOf('/');
// index2 = -1（見つからない）

const text3 = "/code と /image";
const index3 = text3.lastIndexOf('/');
// index3 = 9（最後の `/` の位置）
```

#### ステップ5: `/` が見つかったか確認

```tsx
if (lastSlashIndex !== -1) {
```
- `-1` でなければ `/` が見つかった
- **`!==`**: 厳密不等価演算子（値が異なる かつ 型も考慮）

#### ステップ6: `/` 以降の文字列を取得

```tsx
const textAfterSlash = textBeforeCursor.substring(lastSlashIndex);
```

**例**:
```tsx
const textBeforeCursor = "こんにちは/image";
const lastSlashIndex = 5;
const textAfterSlash = textBeforeCursor.substring(5);
// textAfterSlash = "/image"
```

#### ステップ7: スペースや改行が含まれていないか確認

```tsx
if (!/\s/.test(textAfterSlash)) {
```

**正規表現の解説**:
- **`/\s/`**: 正規表現（パターン）
  - `\s`: スペース、タブ、改行などの空白文字を表す
- **`!`**: NOT（否定）
- **`.test(文字列)`**: 文字列がパターンに一致するか確認
  - 一致すれば `true`
  - 一致しなければ `false`

**つまり**:
```tsx
!/\s/.test("/image")     // true（スペースなし）
!/\s/.test("/image ")    // false（スペースあり）
!/\s/.test("/image\n")   // false（改行あり）
```

**なぜこの確認が必要？**
- `/image ` のように、スペースの後ろは通常の文章なのでコマンドではない
- `/` だけで改行した場合もコマンドではない

#### ステップ8: コマンドモードをONにする

```tsx
setCommandSearch(textAfterSlash);
setShowCommands(true);
setSelectedCommandIndex(0);
return;
```

- **`setCommandSearch(textAfterSlash)`**: コマンド検索文字列を保存（例: `"/image"`）
- **`setShowCommands(true)`**: ポップアップを表示
- **`setSelectedCommandIndex(0)`**: 最初のコマンドを選択状態にする
- **`return`**: この関数をここで終了（以降の処理を実行しない）

#### ステップ9: コマンドモードをOFFにする

```tsx
setShowCommands(false);
setCommandSearch("");
```

- `/` が見つからない、またはスペースがある場合
- コマンドモードを解除する

---

## キーボード操作の実装

### handleContentKeyDown 関数の詳細

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

### ステップごとの解説

#### ステップ1: コマンドモード中か確認

```tsx
if (!showCommands) return;
```
- コマンドポップアップが表示されていない場合は何もしない
- **`!`**: NOT（否定）
- **`return`**: 関数を終了

#### ステップ2: ArrowDown（↓キー）の処理

```tsx
if (e.key === 'ArrowDown') {
    e.preventDefault();
    setSelectedCommandIndex(prev =>
        prev < filteredCommands.length - 1 ? prev + 1 : prev
    );
}
```

**`e.preventDefault()` とは？**
- ブラウザのデフォルト動作をキャンセルする
- 例: ↓キーの通常動作（カーソル移動）を止める

**`setSelectedCommandIndex(prev => ...)` とは？**
- **関数型更新**: 前の値を基に新しい値を計算する
- **`prev`**: 現在の `selectedCommandIndex` の値

**三項演算子の解説**:
```tsx
条件 ? 条件がtrueの時の値 : 条件がfalseの時の値
```

**例**:
```tsx
// コマンドが3つある場合（index: 0, 1, 2）
// filteredCommands.length = 3
// filteredCommands.length - 1 = 2（最後のindex）

prev = 0 の場合:
  0 < 2 ? 0 + 1 : 0  → 1（次へ移動）

prev = 1 の場合:
  1 < 2 ? 1 + 1 : 1  → 2（次へ移動）

prev = 2 の場合:
  2 < 2 ? 2 + 1 : 2  → 2（これ以上進めない）
```

#### ステップ3: ArrowUp（↑キー）の処理

```tsx
else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setSelectedCommandIndex(prev => prev > 0 ? prev - 1 : prev);
}
```

**例**:
```tsx
prev = 2 の場合:
  2 > 0 ? 2 - 1 : 2  → 1（前へ移動）

prev = 1 の場合:
  1 > 0 ? 1 - 1 : 1  → 0（前へ移動）

prev = 0 の場合:
  0 > 0 ? 0 - 1 : 0  → 0（これ以上戻れない）
```

#### ステップ4: Enter キーの処理

```tsx
else if (e.key === 'Enter') {
    e.preventDefault();
    executeCommand(filteredCommands[selectedCommandIndex]);
}
```

- 現在選択されているコマンドを実行
- **`filteredCommands[selectedCommandIndex]`**: 配列から選択中のコマンドを取得

**配列のインデックスアクセス**:
```tsx
const commands = [
  { trigger: '/image', ... },  // index 0
  { trigger: '/code', ... },   // index 1
  { trigger: '/link', ... },   // index 2
];

selectedCommandIndex = 1 の場合:
  commands[1]  → { trigger: '/code', ... }
```

#### ステップ5: Escape キーの処理

```tsx
else if (e.key === 'Escape') {
    e.preventDefault();
    setShowCommands(false);
    setCommandSearch("");
}
```
- コマンドモードをキャンセル
- ポップアップを非表示にする

---

## コマンド実行の流れ

### executeCommand 関数の詳細

```tsx
const executeCommand = (command: Command) => {
    if (!command) return;

    const textarea = contentInputRef.current;
    if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = content.substring(0, cursorPos);
        const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

        if (lastSlashIndex !== -1) {
            const newContent = content.substring(0, lastSlashIndex) + content.substring(cursorPos);
            setContent(newContent);

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

### ステップごとの解説

#### ステップ1: コマンドの存在確認

```tsx
if (!command) return;
```
- コマンドが `null` や `undefined` の場合は何もしない

#### ステップ2: テキストエリアの参照を取得

```tsx
const textarea = contentInputRef.current;
```
- **`contentInputRef.current`**: useRefで保持しているDOM要素
- **型**: `HTMLTextAreaElement | null`

#### ステップ3: カーソル位置を取得

```tsx
const cursorPos = textarea.selectionStart;
```
- 現在のカーソル位置（文字数）

#### ステップ4: カーソルより前のテキストを取得

```tsx
const textBeforeCursor = content.substring(0, cursorPos);
```

#### ステップ5: 最後の `/` の位置を見つける

```tsx
const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
```

#### ステップ6: コマンド文字列を削除した新しい内容を作成

```tsx
const newContent = content.substring(0, lastSlashIndex) + content.substring(cursorPos);
```

**文字列の結合の仕組み**:

元の文字列: `"こんにちは/imageその後"`
- `lastSlashIndex = 5`（`/` の位置）
- `cursorPos = 11`（`/image` の直後）

```tsx
content.substring(0, 5)        // "こんにちは"
content.substring(11)          // "その後"
// 結合すると:
newContent = "こんにちは" + "その後"  // "こんにちはその後"
```

**図解**:
```
元:  こ ん に ち は / i m a g e そ の 後
     0  1  2  3  4  5 6 7 8 9 10 11 12 13
                   ↑              ↑
            lastSlashIndex    cursorPos

substring(0, 5):  "こんにちは"
substring(11):    "その後"
結果:              "こんにちはその後"
```

#### ステップ7: 新しい内容を設定

```tsx
setContent(newContent);
```
- `/image` の部分が削除された内容に更新

#### ステップ8: カーソル位置を調整

```tsx
setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = lastSlashIndex;
    textarea.focus();
}, 0);
```

**`setTimeout(() => {...}, 0)` とは？**
- **0ミリ秒後**に実行（実質的に次のイベントループで実行）
- React の state 更新が完了した後に DOM 操作を行うため

**`selectionStart` と `selectionEnd` とは？**
- **`selectionStart`**: 選択範囲の開始位置
- **`selectionEnd`**: 選択範囲の終了位置
- 両方を同じ値にすると、カーソルがその位置に移動する

**例**:
```tsx
// "こんにちはその後" でカーソルを5文字目（`は` の後）に移動
textarea.selectionStart = 5;
textarea.selectionEnd = 5;
// 結果: こんにちは|その後（| がカーソル）
```

**`textarea.focus()` とは？**
- テキストエリアにフォーカスを当てる（カーソルを点滅させる）

#### ステップ9: コマンドモードを終了

```tsx
setShowCommands(false);
setCommandSearch("");
```

#### ステップ10: コマンドのアクションを実行

```tsx
command.action();
```
- コマンドに紐づいた関数を実行
- 例: `/image` なら `handleInsertImage` 関数が実行される

---

## 画像アップロードの詳細

### uploadImageForContent 関数の詳細

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

### ステップごとの解説

#### `async` と `await` とは？

**`async`**: この関数は非同期処理を行う
```tsx
async (file: File): Promise<string> => {
    // この中で await が使える
}
```

**`await`**: 非同期処理の完了を待つ
```tsx
const res = await fetch(...);  // fetchの完了を待つ
```

**`Promise<string>`**: この関数は最終的に `string` 型の値を返す約束

#### ステップ1: FormData オブジェクトを作成

```tsx
const formData = new FormData();
```

**`FormData` とは？**
- ファイルを含むフォームデータを送信するための特別なオブジェクト
- HTML の `<form>` タグと同じような形式でデータを送れる

#### ステップ2: 画像ファイルを追加

```tsx
formData.append('image', file);
```

**`append(キー, 値)` とは？**
- FormData にデータを追加するメソッド
- **キー**: `'image'`（サーバー側で `formData.get('image')` として受け取る）
- **値**: `file`（File オブジェクト）

**例**:
```tsx
// こんな風にデータが追加される
formData = {
  image: File { name: "photo.jpg", size: 123456, ... }
}
```

#### ステップ3: サーバーにPOSTリクエストを送信

```tsx
const res = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
});
```

**`fetch()` とは？**
- Web API にリクエストを送る関数
- **第1引数**: URL（`"/api/upload-image"`）
- **第2引数**: オプション（method, body など）

**`method: "POST"` とは？**
- HTTP メソッドを指定
- **POST**: データを送信する（作成・アップロード）
- 他に GET（取得）、PUT（更新）、DELETE（削除）などがある

**`await` を使う理由**:
- `fetch` は時間がかかる処理（ネットワーク通信）
- 完了するまで待つ必要がある

#### ステップ4: レスポンスの確認

```tsx
if (res.ok) {
```

**`res.ok` とは？**
- HTTP ステータスコードが 200-299 の範囲なら `true`
- エラー（400, 500など）なら `false`

#### ステップ5: JSONレスポンスをパース

```tsx
const data = await res.json() as { success: boolean; image_url?: string };
```

**`res.json()` とは？**
- レスポンスの body を JSON として解析する
- これも非同期処理なので `await` が必要

**`as { ... }` とは？**
- TypeScript の型アサーション（型の指定）
- レスポンスの形を明示的に指定

**例**:
```tsx
// サーバーからこんなJSONが返ってくる
{
  "success": true,
  "image_url": "https://example.com/image.jpg"
}
```

#### ステップ6: 画像URLを返す

```tsx
return data.image_url || '';
```

**`||` とは？**
- 論理和演算子（OR）
- 左側が `falsy`（`null`, `undefined`, `''` など）なら右側の値を返す

**例**:
```tsx
data.image_url = "https://example.com/image.jpg"  → "https://example.com/image.jpg"
data.image_url = undefined                         → ''
data.image_url = null                              → ''
```

#### ステップ7: エラーの場合は例外を投げる

```tsx
throw new Error('画像のアップロードに失敗しました');
```

**`throw` とは？**
- エラー（例外）を発生させる
- この関数を呼び出した側で `try-catch` で捕まえられる

### handleContentImageSelect 関数の詳細

```tsx
const handleContentImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
            const imageUrl = await uploadImageForContent(file);
            const markdown = `![${file.name}](${imageUrl})`;
            insertTextAtCursor(markdown);
        } catch (err) {
            alert('画像のアップロードに失敗しました: ' + (err instanceof Error ? err.message : ''));
        }
        e.target.value = '';
    }
};
```

#### ステップ1: ファイルが選択されたか確認

```tsx
if (e.target.files && e.target.files[0]) {
```

**`e.target.files` とは？**
- ファイル選択input要素の `files` プロパティ
- 選択されたファイルのリスト（配列のようなオブジェクト）

**`&&` とは？**
- 論理積演算子（AND）
- 両方が `true` なら `true`

**なぜ2つの条件？**
1. `e.target.files`: ファイルリストが存在するか（nullでないか）
2. `e.target.files[0]`: 1つ目のファイルが存在するか

#### ステップ2: ファイルを取得

```tsx
const file = e.target.files[0];
```
- 選択されたファイルの1つ目を取得

#### ステップ3: try-catch でエラー処理

```tsx
try {
    // 成功する可能性がある処理
} catch (err) {
    // エラーが発生した時の処理
}
```

#### ステップ4: 画像をアップロード

```tsx
const imageUrl = await uploadImageForContent(file);
```
- `uploadImageForContent` 関数を呼び出す
- アップロードが完了するまで待つ
- 画像の URL を取得

#### ステップ5: マークダウン記法を作成

```tsx
const markdown = `![${file.name}](${imageUrl})`;
```

**テンプレートリテラル**:
- バッククォート `` ` `` で囲む
- `${}` の中に変数を埋め込める

**例**:
```tsx
file.name = "photo.jpg"
imageUrl = "https://example.com/photo.jpg"

markdown = `![${file.name}](${imageUrl})`
// 結果: "![photo.jpg](https://example.com/photo.jpg)"
```

#### ステップ6: カーソル位置に挿入

```tsx
insertTextAtCursor(markdown);
```

#### ステップ7: エラー処理

```tsx
catch (err) {
    alert('画像のアップロードに失敗しました: ' + (err instanceof Error ? err.message : ''));
}
```

**`err instanceof Error` とは？**
- `err` が `Error` オブジェクトかどうか確認
- `true` なら `err.message` を使う
- `false` なら空文字列

#### ステップ8: input要素をリセット

```tsx
e.target.value = '';
```

**なぜリセットが必要？**
- 同じファイルを再度選択できるようにするため
- リセットしないと、同じファイルを選んでも `onChange` が発火しない

---

## テキスト挿入の仕組み

### insertTextAtCursor 関数の詳細

```tsx
const insertTextAtCursor = (text: string) => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }, 0);
};
```

### ステップごとの解説

#### ステップ1: テキストエリアの参照を取得

```tsx
const textarea = contentInputRef.current;
if (!textarea) return;
```
- DOM要素が取得できない場合は何もしない

#### ステップ2: 選択範囲を取得

```tsx
const start = textarea.selectionStart;
const end = textarea.selectionEnd;
```

**選択範囲とは？**
- ユーザーがドラッグして選択している範囲
- 選択していない場合は、`start` と `end` が同じ値（カーソル位置）

**例**:
```
テキスト: "こんにちは世界"
選択範囲: "にちは"

start = 2（`に` の位置）
end = 5（`は` の次の位置）

カーソルのみ: "こんにちは|世界"
start = 5
end = 5
```

#### ステップ3: 新しい内容を作成

```tsx
const newContent = content.substring(0, start) + text + content.substring(end);
```

**挿入の仕組み**:

元のテキスト: `"こんにちは世界"`
- カーソル位置: 5（`は` と `世` の間）
- 挿入するテキスト: `"![](url)"`

```tsx
content.substring(0, 5)     // "こんにちは"
text                        // "![](url)"
content.substring(5)        // "世界"

newContent = "こんにちは" + "![](url)" + "世界"
// 結果: "こんにちは![](url)世界"
```

**選択範囲がある場合**:

元のテキスト: `"こんにちは世界"`
- 選択範囲: `"にちは"` (start=2, end=5)
- 挿入するテキスト: `"![](url)"`

```tsx
content.substring(0, 2)     // "こん"
text                        // "![](url)"
content.substring(5)        // "世界"

newContent = "こん" + "![](url)" + "世界"
// 結果: "こん![](url)世界"（選択範囲が置き換わる）
```

#### ステップ4: 状態を更新

```tsx
setContent(newContent);
```

#### ステップ5: カーソル位置を調整

```tsx
setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}, 0);
```

**カーソル位置の計算**:
```tsx
start = 5（元のカーソル位置）
text.length = 9（"![](url)" の長さ）

新しいカーソル位置 = 5 + 9 = 14

結果: "こんにちは![](url)|世界"（| がカーソル）
```

---

## まとめ

### 重要なReact/JavaScriptの概念

| 概念 | 説明 | 使用例 |
|------|------|--------|
| `useState` | 状態管理 | `const [content, setContent] = useState("")` |
| `useRef` | DOM参照 | `const ref = useRef<HTMLTextAreaElement>(null)` |
| `async/await` | 非同期処理 | `const url = await uploadImage(file)` |
| `.substring()` | 文字列の切り出し | `"hello".substring(0, 2)` → `"he"` |
| `.lastIndexOf()` | 最後の出現位置 | `"a/b/c".lastIndexOf('/')` → `3` |
| `?.` (オプショナルチェーン) | nullチェック | `ref.current?.focus()` |
| `||` (OR演算子) | デフォルト値 | `value || 'default'` |
| `&&` (AND演算子) | 条件付き実行 | `show && <div>表示</div>` |
| テンプレートリテラル | 文字列補間 | `` `Hello ${name}` `` |
| 三項演算子 | 条件分岐 | `x > 0 ? '正' : '負'` |

### データの流れ

```
ユーザー入力
   ↓
onChange イベント
   ↓
handleContentChange
   ↓
useState で状態更新
   ↓
React が画面を再レンダリング
   ↓
ユーザーに反映
```

---

**最終更新**: 2026-01-19

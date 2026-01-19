import { useState, useRef } from 'react';

// コマンド定義の型
type Command = {
    trigger: string;
    label: string;
    description: string;
    icon: string;
    action: () => void;
};

export default function PostForm() {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");

    // スラッシュコマンド用の状態
    const [showCommands, setShowCommands] = useState(false);
    const [commandSearch, setCommandSearch] = useState("");
    const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

    // ref
    const contentInputRef = useRef<HTMLTextAreaElement>(null);
    const hiddenImageInputRef = useRef<HTMLInputElement>(null);

    const categories = ["温泉", "料理", "ねこ", "技術", "日常"];

    // 画像を本文用にアップロードする関数
    const uploadImageForContent = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', 'temp');
        formData.append('category', 'temp');
        formData.append('content', 'temp');
        formData.append('password', password);

        const res = await fetch("/api/post", {
            method: "POST",
            body: formData,
        });

        if (res.ok) {
            const data = await res.json() as { post?: { id?: number; image_url?: string } };
            // 仮投稿を削除
            if (data.post?.id) {
                await fetch(`/api/post/${data.post.id}`, {
                    method: "DELETE",
                    headers: { 'X-Auth-Password': password },
                });
            }
            return data.post?.image_url || '';
        }
        throw new Error('画像のアップロードに失敗しました');
    };

    // 画像挿入コマンドを実行
    const handleInsertImage = () => {
        hiddenImageInputRef.current?.click();
    };

    // 画像ファイルが選択された時の処理
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
            // input要素をリセット
            e.target.value = '';
        }
    };

    // カーソル位置にテキストを挿入
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

    // コマンド定義
    const commands: Command[] = [
        {
            trigger: '/image',
            label: '画像を挿入',
            description: '画像ファイルを選択してアップロード',
            icon: '📷',
            action: handleInsertImage,
        },
        {
            trigger: '/code',
            label: 'コードブロック',
            description: 'コードブロックを挿入',
            icon: '💻',
            action: () => insertTextAtCursor('\n```\n\n```\n'),
        },
        {
            trigger: '/link',
            label: 'リンク',
            description: 'リンクを挿入',
            icon: '🔗',
            action: () => insertTextAtCursor('[リンクテキスト](URL)'),
        },
    ];

    // コマンドをフィルタリング
    const filteredCommands = commandSearch
        ? commands.filter(cmd => cmd.trigger.startsWith(commandSearch.toLowerCase()))
        : commands;

    // 本文の入力処理
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        const cursorPos = e.target.selectionStart;

        setContent(newContent);

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

    // キーボードイベント処理
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

    // コマンドを実行
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {//投稿ボタンを押したときに実行される関数
        e.preventDefault();
        
        //FormDataオブジェクトを作成
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('content', content);
        formData.append('password', password);

        //もし画像ファイルが選択されていたらformDataに追加
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        //APIにformData送信
        const res = await fetch("/api/post", {
            method: "POST",
            body: formData,
        });

        if (res.ok) {
            alert("投稿が保存されました!");
            window.location.reload();
        } else {
            const err=await res.text();
            alert("エラー:"+err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 max-w-md mx-auto border rounded-lg mt-8'>
            <div className="flex w-full gap-4">
              <input type='text' placeholder='タイトル' value={title} onChange={(e) => setTitle(e.target.value)} className="w-1/2 border p-2 rounded" required maxLength={30} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-1/2 border p-2 rounded" required >
                  <option value="" disabled>カテゴリを選択してください</option>
                  {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            
            <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">アイキャッチ画像（任意）</label>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*" // シンプルな画像選択に戻す
                    onChange={(e) => { // 変換処理をなくし、直接ファイルをセット
                        if (e.target.files && e.target.files[0]) {
                            setImageFile(e.target.files[0]);
                        } else {
                            setImageFile(null);
                        }
                    }}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>
            
            <div className="relative">
                <textarea
                    ref={contentInputRef}
                    placeholder='本文（ / でコマンド入力）'
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleContentKeyDown}
                    className='w-full border p-2 rounded min-h-[120px]'
                    required
                />

                {/* オートコンプリートUI */}
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

                {/* 非表示の画像選択input */}
                <input
                    ref={hiddenImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleContentImageSelect}
                    className="hidden"
                />
            </div>
            
            <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded" required />
            
            <button type='submit' className='force-bg-gray text-black py-2 rounded'>投稿</button>
        </form>
    );
}
import {useState} from 'react';
import heic2any  from 'heic2any';

export default function PostForm(){
    const[title,setTitle]=useState("");
    const[category,setCategory]=useState("");
    const[content,setContent]=useState("");
    const[imageFile,setImageFile]=useState<File|null>(null);
    const[password,setPassword]=useState("");
    const[isConverting,setIsConverting]=useState(false); //画像が変換中の状態

    const categories=["温泉","料理","ねこ","技術","日常"]

    const handleImageChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
        const file=e.target.files?.[0];
        if(!file){
            setImageFile(null);
            return;
        }

        //ファイルがHEIC形式かチェック
        const isHeic=file.type==="image/heic" ||file.type==="image/heif"||file.name.toLowerCase().endsWith(".heic");

        if(isHeic){
            setIsConverting(true); //変換中状態にセット
            try{
                //heic2anyでjpegに変換
                const convertedBlob=await heic2any({
                    blob:file,
                    toType:"image/jpeg",
                }) as Blob;

                //変換後のblobをfileオブジェクトに戻す
                const newFileName=file.name.replace(/\.[^/.]+$/,"")+".jpeg";
                const convertedFile=new File([convertedBlob],newFileName,{type:"image/jpeg"});

                setImageFile(convertedFile);
            }catch(error){
                console.error("HEIC conversion error:",error);
                alert("画像の変換に失敗しました");
                setImageFile(null);
            }finally{
                setIsConverting(false); //変換中状態を解除
            }
        }else{
            //HEIC形式でなければそのままセット
            setImageFile(file);
        }
    };

    const handleSubmit=async(e:React.FormEvent)=>{ //投稿ボタンを押したときに実行される関数
        e.preventDefault();

        //FormDataオブジェクトを作成
        const formData=new FormData();
        formData.append('title',title);
        formData.append('category', category);
        formData.append('content', content);
        formData.append('password', password);

        //もし画像ファイルが選択されていたらformDataに追加
        if(imageFile){
            formData.append('image',imageFile);
        }
        //APIにformData送信
        const res=await fetch("/api/post",{ 
            method:"POST",
            body:formData,
        });

        if(res.ok){
            alert("投稿が保存されました!");
            setTitle("");
            setCategory("");
            setContent("");
            setPassword("");
        }else{
            const err=await res.text();
            alert("エラー:"+err);
        }
    };

    return(
        <form onSubmit={handleSubmit} className='flex flex-wrap gap-4 p-4 max-w-md mx-auto'>
            <input
                type='text'
                placeholder='タイトル'
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                className="flex-1 border p-2 rounded"
                required
                maxLength={30}
            />

            <select //カテゴリ
                value={category}
                onChange={(e)=>setCategory(e.target.value)}
                className='flex-1 border p-2 rounded'
                required
            >
                <option value="" disabled>カテゴリを選択してください</option>
                {categories.map((cat)=>(
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
            <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700">
                    アイキャッチ画像（任意）
                </label>
                <input
                    id="image-upload"
                    type="file"
                    accept="image/*,.heic,.heif"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {isConverting && <p className="text-sm text-gray-500 mt-1">画像を変換中...</p>}
            </div>
            <textarea
                placeholder='本文'
                value={content}
                onChange={(e)=>setContent(e.target.value)}
                className='w-full border p-2 rounded min-h-[120px]'
                required
            />
            {/* 4. パスワード入力欄をフォームに追加 */}
            <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded"
                required
            />

            <button
                type='submit'
                className='force-bg-gray text-black py-2 rounded'
            >
            投稿
            </button>
        </form> 
    )
}
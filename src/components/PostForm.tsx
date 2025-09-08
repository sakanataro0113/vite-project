import {useState} from 'react';

export default function PostForm(){
    const[title,setTitle]=useState("");
    const[category,setCategory]=useState("");
    const[content,setContent]=useState("");
    //const[imageFile,setImageFile]=useState<File|null>(null);
    const[password,setPassword]=useState("");

    const categories=["温泉","料理","ねこ","技術","日常"]

    const handleSubmit=async(e:React.FormEvent)=>{ //投稿ボタンを押したときに実行される関数
        e.preventDefault();

        //APIに送信
        const res=await fetch("/api/post",{ 
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({
                title,
                category,
                content,
                password,
            }),
        });

        if(res.ok){
            alert("投稿が保存されました!");
            setTitle("");
            setCategory("");
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
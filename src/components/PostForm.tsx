import {useState} from 'react';

export default function PostForm(){
    const[title,setTitle]=useState("");
    const[category,setCategory]=useState("");
    const[content,setContent]=useState("");

    const handleSubmit=async(e:React.FormEvent)=>{
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
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 max-w-md mx-auto'>
            <input
                type='text'
                placeholder='タイトル'
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                className="border p-2 rounded"
                required
            />

            <input
                type='text'
                placeholder='カテゴリ'
                value={category}
                onChange={(e)=>setCategory(e.target.value)}
                className='border p-2 rounded'
                required
            />

            <textarea
                placeholder='本文'
                value={content}
                onChange={(e)=>setContent(e.target.value)}
                className='border p-2 rounded min-h-[120px]'
                required
            />

            <button
                type='submit'
                className='bg-blue-500 text-white py-2 rounded hover:bg-blue-600'
            >
            投稿
            </button>
        </form> 
    )
}
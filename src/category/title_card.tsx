import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import type {PostData} from '../../functions/api/post.ts';

type TitleCardProps={
    category:string;
};

type ApiResponse={
    posts:PostData[];
}

const TitleCard:React.FC<TitleCardProps>=({category})=>{
    const [posts,setPosts]=useState<PostData[]>([]);

    useEffect(()=>{
        fetch('/api/post')
            .then(res=>res.json())
            .then(data=>setPosts((data as ApiResponse).posts));
    },[]);

    // 削除ボタンが押されたときの処理を行う関数
    const handleDelete = async (postId: number) => {
        // ユーザーに本当に削除するか確認
        if (!window.confirm("この記事を本当に削除しますか？")) {
            return; // キャンセルされたら何もしない
        }
        const password=window.prompt("削除するにはパスワードを入力してください：");
        if (password === null || password === "") return;

        // バックエンドの削除APIを呼び出す
        const res = await fetch(`/api/post/${postId}`, {
            method: "DELETE",
            headers:{
                'X-Auth-Password':password,
            },
        });

        if (res.ok) {
            alert("記事を削除しました。");
            // 画面からも削除された記事をリアルタイムで消す
            setPosts(posts.filter(post => post.id !== postId));
        } else {
            alert("記事の削除に失敗しました。");
        }
    };

    //カテゴリーごとの投稿をフィルタリング
    const filteredPosts=posts.filter(post=>post.category===category);

    return(
        <div>
            <h1>{category}の記事一覧</h1>
            {filteredPosts.length===0?(
                <p>このカテゴリの記事はまだありません。</p>
            ):(
                filteredPosts.map(post=>(
                    <div key={post.id} className="category-card border rounded-lg p-4 shadow-md mb-4">
                        {/* ↓↓ 作成日時を表示 ↓↓ */}
                        <p>作成日時: {new Date(post.created_at).toLocaleString()}</p>
                        {/* ↓↓ IDを表示 ↓↓ */}
                        <p>記事ID: {post.id}</p>
                        <h2 className='w-full break-words'>{post.title}</h2>
                        {/*imageが存在するときに表示 */}
                        {post.image_url&&(
                            <img
                                src={post.image_url}
                                alt={post.title}
                                className='article-image'
                            />
                        )}
                        <p className='w-full break-words'>{post.content.slice(0,50)}</p>
                        <Link to={`/post/${post.id}`}>続きを読む</Link>
                        <button
                            onClick={() => handleDelete(post.id)}
                            className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                        >
                            削除
                        </button>
                    </div> 
                ))
            )}
        </div>
    );
};

export default TitleCard;
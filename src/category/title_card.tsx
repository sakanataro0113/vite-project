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
    //const filteredPosts=posts.filter(post=>post.category===category);
    const filteredPosts=category==="すべて"
        ?posts
        :posts.filter(post=>post.category===category);


    return(
        <div>
            <h1>{category}の記事一覧</h1>
            {filteredPosts.length===0?(
                <p>このカテゴリの記事はまだありません。</p>
            ):(
                filteredPosts.map(post=>{
                    const plainText = post.content
                        .replace(/!\[.*?\]\(.*?\)/g, '[画像]')
                        .replace(/\[.*?\]\(.*?\)/g, '')
                        .slice(0, 50);
                    return(
                        <div>
    <h1 style={{fontSize:"36px", fontWeight:"700", letterSpacing:"-0.03em", margin:"48px 0 32px"}}>{category}の記事一覧</h1>
    {filteredPosts.length === 0 ? (
      <p>このカテゴリの記事はまだありません。</p>
    ) : (
      filteredPosts.map(post => {
        // マークダウンの画像・リンク記法を除去して先頭80文字を抜粋
        const plainText = post.content
          .replace(/!\[.*?\]\(.*?\)/g, '[画像]')
          .replace(/\[.*?\]\(.*?\)/g, '')
          .slice(0, 80);
        return (
          // 画像ありの場合は has-image クラスを追加してgrid-template-columnsを2列にする
            <div key={post.id} className="article-card">

                        {/* 左側：テキストエリア */}
                        <div className="article-card-body">

                        {/* 投稿日時とカテゴリタグ */}
                        <div className="article-card-meta">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="article-card-tag">{post.category}</span>
                        </div>

                        {/* タイトル */}
                        <h2 className="article-card-title">{post.title}</h2>

                        {/* 本文の抜粋 */}
                        <p className="article-card-excerpt">{plainText}</p>

                        {/* 続きを読むリンクと削除ボタン */}
                        <div className="article-card-actions">
                            <Link to={`/post/${post.id}`} className="article-card-link">続きを読む →</Link>
                            <button onClick={() => handleDelete(post.id)} className="article-card-delete">削除</button>
                        </div>

                        </div>

                        {/* 右側：サムネイル画像（画像がある場合のみ表示） */}
                        {post.image_url && (
                        <img src={post.image_url} alt={post.title} className="article-card-thumb" />
                        )}

                    </div>
                    );
                })
                )}
            </div>

        );
                })
            )}
        </div>
    );
};

export default TitleCard;
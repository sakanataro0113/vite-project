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

    //カテゴリーごとの投稿をフィルタリング
    const filteredPosts=posts.filter(post=>post.category===category);

    return(
        <div>
            <h1>{category}の記事一覧</h1>
            {filteredPosts.length===0?(
                <p>このカテゴリの記事はまだありません。</p>
            ):(
                filteredPosts.map(post=>(
                    <div key={post.category} className="category-card border rounded-lg p-4 shadow-md mb-4">
                        <h2 className='w-full break-words'>{post.title}</h2>
                        <p className='w-full break-words'>{post.content.slice(0,50)}</p>
                        <Link to={`/post/${post.category}`}>続きを読む</Link>
                    </div> 
                ))
            )}
        </div>
    );
};

export default TitleCard;
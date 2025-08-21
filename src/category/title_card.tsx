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

    return(
        <div>
            {posts.map(post=>(
                <div key={post.category} className="category-card">
                    <h2>{post.title}</h2>
                    <p>{post.content.slice(0,50)}</p>
                    <img src={post.image_url} style={{width:100,height:100}}/>
                    <Link to={`/category/${post.category}`}>{post.category}</Link>
                </div>
            ))}
        </div>
    );
};

export default TitleCard;
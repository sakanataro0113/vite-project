import React from 'react';
import {Link} from 'react-router-dom';

type TitleCardProps={
    category:String;
};

const TitleCard:React.FC<TitleCardProps>=({category})=>{
    return(
        <div className="category-card">
            <Link to={`/category/${category}`}>{category}のページ</Link>
        </div>
    );
};

export default TitleCard;
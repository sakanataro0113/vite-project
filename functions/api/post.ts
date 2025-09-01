//投稿保存用API
import {Hono} from 'hono'
import type { D1Database } from '@cloudflare/workers-types';

const app=new Hono<{Bindings:{DB:D1Database}}>();

//postリクエストデータ
type PostData={
    id:number;
    title:string;
    category:string;
    image_url?:string;
    content:string;
};

//POSTリクエストで投稿を保存
app.post('/',async(c)=>{
    const body=await c.req.json<PostData>();

    const{title, category, image_url, content } = body;

    //created_atはサーバー側で生成
    const created_at=new Date().toISOString();

    try{
        await c.env.DB.prepare(
            `INSERT INTO posts (title, category, image_url, content,created_at)
            VALUES (?, ?, ?, ?,?)`
        ).bind(title,category,image_url,content,created_at).run();

        return c.json({success:true,message:'Post saved successfully'})
    }catch(err){
        console.error(err);
        return c.json({success:false,error:'Failed to save post'},500);
    }
})

//GETリクエストで投稿一覧を取得
app.get('/',async(c)=>{
    try{
        const{results}=await c.env.DB.prepare(
            `SELECT id, title, category, image_url, content, created_at
       FROM posts ORDER BY created_at DESC`
        ).all()

        return c.json({success:true,posts:results})
    }catch(err){
        console.error(err);
        return c.json({success:false,error:'Failed to fetch posts'},500)
    }
})







export default app;
export type {PostData};




import {Routes,Route,Link} from 'react-router-dom'
import {useState,useEffect} from 'react';
import TitleCard from './category/title_card.tsx';
import PostDetailPage from './components/PostDetailPage.tsx';
import PostForm from './components/PostForm.tsx';
import Profile from './components/profile.tsx';
import { handle } from 'hono/cloudflare-pages';

export default function App(){
  const categories=["温泉","料理","ねこ","技術","日常"]

  //スティッキーヘッダー作成
  const[isSticky,setIsSticky]=useState(false);
  //スクロールイベントをuseEffectで監視
  useEffect(()=>{
    const handleScroll=()=>{
      if(window.scrollY>100){
        setIsSticky(true);
      }else{
        setIsSticky(false);
      }
    }
    //スクロールイベントリスナーを追加
    window.addEventListener("scroll",handleScroll);

    //コンポーネントが不要になったらイベントリスナーを削除
    return()=>{
      window.removeEventListener("scroll",handleScroll);
    }
  },[]);//このeffectは最初に一度だけ実行


  //カテゴリを2行に分けたい
  const firstRow=categories.slice(0,3);
  const secondRow=categories.slice(3);

  return(
    <div>
      {/*ヘッダー*/}
      <header className="site-header" style={{padding:"1rem",background:"#f0f0f0"}}>
        <h1>My Blog</h1>
        <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          {/* 1行目のリンク */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link to="/">ホーム</Link>
            {firstRow.map(cat => (
              <Link key={cat} to={`/category/${cat}`}>{cat}</Link>
            ))}
          </div>
          {/* 2行目のリンク */}
          <div style={{ display: "flex", gap: "1rem" }}>
            {secondRow.map(cat => (
              <Link key={cat} to={`/category/${cat}`}>{cat}</Link>
            ))}
            <Link to="/profile">執筆者</Link>
          </div>
        </nav>
      </header>

      {/* ↓↓ スクロールした時にだけ表示されるヘッダーを追加 ↓↓ */}
      {isSticky && (
        <header className="sticky-header">
          <Link to="/">My Blog</Link>
          <nav>
            <Link to="/">ホーム</Link>
            <Link to="/profile">プロフィール</Link>
          </nav>
        </header>
      )}

      {/*ページ切り替え */}
      <main style={{padding:"1rem"}}>
        <Routes>
          <Route path='/' element={<TitleCard category="すべて" />}/>
          {categories.map(cat=>(
              <Route
                key={cat}
                path={`/category/${cat}`}
                element={<TitleCard category={cat}/>}
              />
          ))}
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path='/profile' element={<Profile/>}/>
        </Routes>
        <PostForm/>
      </main>
    </div>
  )
}


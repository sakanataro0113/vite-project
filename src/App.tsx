import {Routes,Route,Link} from 'react-router-dom'
import {useState,useEffect,useRef} from 'react';
import TitleCard from './category/title_card.tsx';
import PostDetailPage from './components/PostDetailPage.tsx';
import PostForm from './components/PostForm.tsx';
import Profile from './components/profile.tsx';

export default function App(){
  const categories=["温泉","料理","ねこ","技術","日常"]

  //スティッキーヘッダー作成
  const[isSticky,setIsSticky]=useState(false);

  // 1. 通常ヘッダーを測定するためのrefを作成
  const mainHeaderRef = useRef<HTMLElement>(null);

  //スクロールイベントをuseEffectで監視
  useEffect(()=>{
    const handleScroll=()=>{
      if(mainHeaderRef.current && window.scrollY > mainHeaderRef.current.offsetHeight){
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

  //PostFormコンポーネントのための参照(ref)を作成
  const postFormRef=useRef<HTMLDivElement>(null);

  //PostFormまでスクロールする関数
  const scrollToPostForm=()=>{
    postFormRef.current?.scrollIntoView({behavior:"smooth"});
  };

  //topまでスクロールする関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0, // ページの最上部(0px地点)へ
      behavior: 'smooth' // スムーズにスクロールする
    });
  };

  return(
    <div>
      {/*ヘッダー*/}
      <header className="site-header" style={{padding:"1rem",background:"#f0f0f0"}} ref={mainHeaderRef}>
        <h1>個人ブログ</h1>
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
          <div className="sticky-header-inner">
            <Link to="/profile">プロフィール</Link>
            <nav>
              <button onClick={scrollToPostForm} className="hover:underline">投稿</button>
              <button onClick={scrollToTop} className="hover:underline">トップ</button>
            </nav>
          </div>
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
        <div ref={postFormRef}>
          <PostForm />
        </div>
      </main>
    </div>
  )
}


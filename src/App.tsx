import {Routes,Route,Link,useLocation} from 'react-router-dom'
import {useState,useEffect,useRef} from 'react';
import TitleCard from './category/title_card.tsx';
import PostDetailPage from './components/PostDetailPage.tsx';
import PostForm from './components/PostForm.tsx';
import Profile from './components/profile.tsx';
import MapPage from './components/MapPage.tsx';

export default function App(){
  const categories=["温泉","料理","ねこ","技術","日常"]
  const [activeCat, setActiveCat] = useState("home") 

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


  //PostFormコンポーネントのための参照(ref)を作成
  const postFormRef=useRef<HTMLDivElement>(null);

  //PostFormまでスクロールする関数
  const scrollToPostForm=()=>{
    postFormRef.current?.scrollIntoView({behavior:"smooth"});
  };

  return(
    <div>
      {/*ヘッダー*/}
      <header className="site-header" ref={mainHeaderRef}>
        <h1>My Blog</h1>
        <nav className="pill-track">
          <Link to="/" className={activeCat==="home" ? "pill-link active" : "pill-link"} onClick={()=>setActiveCat("home")}>ホーム</Link>
          {categories.map(cat=>(
            <Link key={cat} to={`/category/${cat}`} className={activeCat===cat ? "pill-link active" : "pill-link"} onClick={()=>setActiveCat(cat)}>{cat}</Link>
          ))}
          <Link to="/map" className={activeCat==="map" ? "pill-link active" : "pill-link"} onClick={()=>setActiveCat("map")}>Map</Link>
          <Link to="/profile" className={activeCat==="profile" ? "pill-link active" : "pill-link"} onClick={()=>setActiveCat("profile")}>プロフィール</Link>
        </nav>
      </header>

      {/* ↓↓ スクロールした時にだけ表示されるヘッダーを追加 ↓↓ */}
      {isSticky && (
        <header className="sticky-header">
          <div className="sticky-header-inner">
            <Link to="/" className="sticky-site-title" onClick={()=>window.scrollTo({top:0, behavior:'instant'})}>My Blog</Link>
            <div className="sticky-sep"/>
            {categories.map(cat=>(
              <Link key={cat} to={`/category/${cat}`} className={activeCat===cat ? "sticky-link active" : "sticky-link"} onClick={()=>{setActiveCat(cat); window.scrollTo({top:0, behavior:'instant'})}}>{cat}</Link>
            ))}
            <Link to="/map" className={activeCat==="map" ? "sticky-link active" : "sticky-link"} onClick={()=>{setActiveCat("map"); window.scrollTo({top:0, behavior:'instant'})}}>Map</Link>
            <div className="sticky-sep"/>
            <Link to="/profile" className="sticky-muted" onClick={()=>{setActiveCat("profile"); window.scrollTo({top:0, behavior:'instant'})}}>プロフィール</Link>
            <button onClick={scrollToPostForm} className="sticky-post-btn">投稿</button>
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
          <Route path='/map' element={<MapPage/>}/>
          <Route path='/profile' element={<Profile/>}/>
        </Routes>
        <div ref={postFormRef}>
          <PostForm />
        </div>
      </main>
    </div>
  )
}

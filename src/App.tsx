import {Routes,Route,Link} from 'react-router-dom'
import {useState,useEffect,useRef} from 'react';
import TitleCard from './category/title_card.tsx';
import PostDetailPage from './components/PostDetailPage.tsx';
import PostForm from './components/PostForm.tsx';
import Profile from './components/profile.tsx';
import MapPage from './components/MapPage.tsx';

export default function App(){
  const categories=["温泉","料理","ねこ","技術","日常"]
  const [activeCat, setActiveCat] = useState("home")
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

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

      {/* ── モバイル・タブレット ボトムナビ ── */}
      {showCategoryMenu && (
        <div className="bottom-nav-overlay" onClick={()=>setShowCategoryMenu(false)} />
      )}
      <div className="bottom-nav-wrapper">
        {showCategoryMenu && (
          <div className="bottom-nav-category-popup">
            <Link to="/" className={activeCat==='home'?'bottom-nav-cat-link active':'bottom-nav-cat-link'}
              onClick={()=>{setActiveCat('home');setShowCategoryMenu(false);window.scrollTo({top:0,behavior:'instant'});}}>
              すべて
            </Link>
            {categories.map(cat=>(
              <Link key={cat} to={`/category/${cat}`}
                className={activeCat===cat?'bottom-nav-cat-link active':'bottom-nav-cat-link'}
                onClick={()=>{setActiveCat(cat);setShowCategoryMenu(false);window.scrollTo({top:0,behavior:'instant'});}}>
                {cat}
              </Link>
            ))}
          </div>
        )}
        <div className="bottom-nav-bar">
          <Link to="/" className={activeCat==='home'?'bottom-nav-item active':'bottom-nav-item'}
            onClick={()=>{setActiveCat('home');setShowCategoryMenu(false);window.scrollTo({top:0,behavior:'instant'});}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>ホーム</span>
          </Link>
          <button className={showCategoryMenu?'bottom-nav-item active':'bottom-nav-item'}
            onClick={()=>setShowCategoryMenu(!showCategoryMenu)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span>カテゴリ</span>
          </button>
          <Link to="/map" className={activeCat==='map'?'bottom-nav-item active':'bottom-nav-item'}
            onClick={()=>{setActiveCat('map');setShowCategoryMenu(false);window.scrollTo({top:0,behavior:'instant'});}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Map</span>
          </Link>
          <Link to="/profile" className={activeCat==='profile'?'bottom-nav-item active':'bottom-nav-item'}
            onClick={()=>{setActiveCat('profile');setShowCategoryMenu(false);window.scrollTo({top:0,behavior:'instant'});}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>プロフィール</span>
          </Link>
          <button className="bottom-nav-item"
            onClick={()=>{setShowCategoryMenu(false);scrollToPostForm();}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span>投稿</span>
          </button>
        </div>
      </div>
    </div>
  )
}

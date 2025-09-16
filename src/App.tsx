import {Routes,Route,Link} from 'react-router-dom'
import TitleCard from './category/title_card.tsx';
import PostDetailPage from './components/PostDetailPage.tsx';
import PostForm from './components/PostForm.tsx';
import Profile from './components/profile.tsx';

export default function App(){
  const categories=["温泉","料理","ねこ","技術","日常"]

  return(
    <div>
      {/*ヘッダー*/}
      <header style={{padding:"1rem",background:"#f0f0f0"}}>
        <h1>My Blog</h1>
        <nav style={{display:"flex",gap:"1rem",justifyContent: "center"}}>
          <Link to="/">ホーム</Link>
          {categories.map(cat=>(
            <Link key={cat} to={`/category/${cat}`}>{cat}</Link>
          ))}
          <Link to="/profile">執筆者</Link>
        </nav>
      </header>

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


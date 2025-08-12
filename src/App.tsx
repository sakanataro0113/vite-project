import {Routes,Route,Link} from 'react-router-dom'

function Home(){
  return <h2>ブログのトップページ(記事一覧予定)</h2>
}

function Category({name}:{name:string}){
  return <h2>{name}のページ</h2>
}

export default function App(){
  const categories=["温泉","料理","ねこ","技術","日常"]

  return(
    <div style={{
      maxWidth: "1920px",
      margin: "0 auto",
      padding: "1rem"
    }}>
      {/*ヘッダー*/}
      <header style={{padding:"1rem",background:"#f0f0f0"}}>
        <h1>My Blog</h1>
        <nav style={{display:"flex",gap:"1rem",justifyContent: "center"}}>
          <Link to="/">ホーム</Link>
          {categories.map(cat=>(
            <Link key={cat} to={`/category/${cat}`}>{cat}</Link>
          ))}
        </nav>
      </header>

      {/*ページ切り替え */}
      <main style={{padding:"1rem"}}>
        <Routes>
          <Route path='/' element={<Home/>}/>
          {categories.map(cat=>(
              <Route
                key={cat}
                path={`/category/${cat}`}
                element={<Category name={cat}/>}
              />
          ))}
        </Routes>
      </main>
    </div>
  )
}
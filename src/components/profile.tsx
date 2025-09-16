export default function profile(){
    return (
        <div>
            <h2>ブログ執筆者紹介</h2>
            <div className='profimg'>
                <img
                    src='../../public/profile.jpeg'
                    alt='執筆者画像'
                    className='article-image'
                />
            </div>
            <p>年齢：20歳</p>
            <p>職業：学生(情報系大学生)</p>
            <p>趣味：ゲーム、アニメ、温泉巡り、=LOVE(new)</p>
        </div>
    )
}
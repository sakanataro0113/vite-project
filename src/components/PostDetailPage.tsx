import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PostData } from '../../functions/api/post.ts';

export default function PostDetailPage() {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLから記事のIDを取得する
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/post/${id}`);
        if (!res.ok) {
          throw new Error('記事の読み込みに失敗しました。');
        }
        const data = await res.json<{ post: PostData }>();
        setPost(data.post);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]); // idが変わるたびに記事を再取得

  if (loading) return <div>ローディング中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!post) return <div>記事が見つかりません。</div>;

  return (
    <div className="p-4 md:p-8">
      <Link to="/category/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; 記事一覧に戻る</Link>
      <article>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-4">
          <span>カテゴリ: </span>
          <Link to={`/category/${post.category}`} className="font-semibold hover:underline">{post.category}</Link>
          <span className="mx-2">|</span>
          <span>作成日時: {new Date(post.created_at).toLocaleString()}</span>
        </div>
        {post.image_url && (
          <div className="w-full my-4">
            <img 
            src={post.image_url} 
            alt={post.title} 
            width={800}
            height={400}
            />
          </div>
        )}
        {/* 改行を<br>タグに変換して表示 */}
        <div className="prose lg:prose-xl max-w-none mt-8">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
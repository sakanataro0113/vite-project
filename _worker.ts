import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

// --- 型定義 ---

// Cloudflareの環境変数（D1データベース）の型
type Bindings = {
  DB: D1Database;
};

// フロントエンドから「送られてくる」投稿データ用の型
// idとcreated_atは含まず、image_urlは任意（オプショナル）
type PostRequestBody = {
  title: string;
  category: string;
  image_url?: string; // '?' は、この項目がなくても良いことを示す
  content: string;
};

// データベースから「取得した」完全な投稿データ用の型
type PostData = {
  id: number;
  title: string;
  category: string;
  image_url: string | null; // DBではnullになる可能性
  content: string;
  created_at: string;
};

// --- Honoアプリケーションの作成 ---

const app = new Hono<{ Bindings: Bindings }>();

// --- APIルートの定義 ---

/**
 * POST /api/post
 * 新しい投稿を作成するエンドポイント
 */
app.post('/api/post', async (c) => {
  try {
    // 1. フロントエンドから送られてきたJSONデータをパース
    const body = await c.req.json<PostRequestBody>();

    // 2. データを取り出し、image_urlがなければnullを設定
    const { title, category, image_url = null, content } = body;

    // 3. バリデーション：必須項目が空でないかチェック
    if (!title || !content || !category) {
      return c.json({ success: false, error: 'Title, content, and category are required' }, 400);
    }

    // 4. created_atをサーバー側で生成
    const created_at = new Date().toISOString();

    // 5. データベースにデータを挿入
    await c.env.DB.prepare(
      `INSERT INTO posts (title, category, image_url, content, created_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(title, category, image_url, content, created_at).run();

    // 6. 成功のレスポンスを返す（201 Created）
    return c.json({ success: true, message: 'Post saved successfully' }, 201);

  } catch (err) {
    console.error(err);
    // 7. エラーが発生した場合のレスポンスを返す
    return c.json({ success: false, error: 'Failed to save post' }, 500);
  }
});

/**
 * GET /api/post
 * 投稿の一覧を取得するエンドポイント
 * URLに ?category=... を付けると、そのカテゴリで絞り込み可能
 */
app.get('/api/post', async (c) => {
  try {
    // 1. URLのクエリパラメータから 'category' を取得
    const category = c.req.query('category');
    
    let query;
    // 2. categoryパラメータの有無でSQLクエリを分岐
    if (category) {
      // カテゴリ指定がある場合：WHERE句で絞り込み
      query = c.env.DB.prepare(
        `SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC`
      ).bind(category);
    } else {
      // カテゴリ指定がない場合：全件取得
      query = c.env.DB.prepare(
        `SELECT * FROM posts ORDER BY created_at DESC`
      );
    }

    // 3. クエリを実行し、結果を取得
    const { results } = await query.all();

    // 4. 成功のレスポンスとして、投稿データを返す
    return c.json({ success: true, posts: results as PostData[]});

  } catch (err) {
    console.error(err);
    // 5. エラーが発生した場合のレスポンスを返す
    return c.json({ success: false, error: 'Failed to fetch posts' }, 500);
  }
});

// Honoアプリケーションをエクスポート
export default app;
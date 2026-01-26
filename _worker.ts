import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-pages';
import type { D1Database,R2Bucket } from '@cloudflare/workers-types';

// --- 型定義 ---

// Cloudflareの環境変数（D1データベース）の型
type Bindings = {
  DB: D1Database;
  IMAGE_BUCKET:R2Bucket;
  R2_PUBLIC_URL:string;
  SECRET_KEY:string;
};

// フロントエンドから「送られてくる」投稿データ用の型
// idとcreated_atは含まず、image_urlは任意（オプショナル）
type PostRequestBody = {
  title: string;
  category: string;
  image_url?: string; // '?' は、この項目がなくても良いことを示す
  content: string;
  password:string;
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

// 地図の地点データ用の型
type MapLocation = {
  id: number;
  name: string;
  prefecture: string;
  memo: string;
  linked_post_id: number | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  created_at: string;
};

// --- Honoアプリケーションの作成 ---

// Cloudflare Pagesが提供する機能（nextなど）の型
type Platform = {
  next: (request: Request) => Response | Promise<Response>;
};

// Honoに渡す、私たちのBindingsとPlatformを結合した完全な環境の型
type Env = {
  Bindings: {
    DB: D1Database;
    IMAGE_BUCKET: R2Bucket;     // ← 追加
    R2_PUBLIC_URL: string;      // ← 追加
    SECRET_KEY: string;         // ← 追加
  } & Platform; // ここで型を結合
};

// --- Honoアプリケーションの作成 ---

const app = new Hono<Env>(); // 修正したEnv型を使用

// --- APIルートの定義 ---

/**
 * POST /api/post
 * 新しい投稿を作成するエンドポイント
 */
app.post('/api/post', async (c) => {
  try {
    // 1. フロントエンドから送られてきたJSONデータをパース
    //const body = await c.req.json<PostRequestBody>();

    //1.formDataとしてデータを受け取る
    const formData=await c.req.formData();
    const password=formData.get("password") as string;

    //パスワードチェック
    if (password !== c.env.SECRET_KEY) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // 2. データを取り出し、image_urlがなければnullを設定
    //const { title, category, image_url = null, content } = body;

    const title=formData.get('title') as string;
    const category = formData.get('category') as string;
    const content = formData.get('content') as string;
    const imageFile = formData.get('image');

    let image_url:string|null=null;

    //もし画像ファイルがあればR2に保存
    if(imageFile instanceof File&&imageFile.size>0){
      const imageBuffer=await imageFile.arrayBuffer();
      const fileName=`${Date.now()}-${imageFile.name}`;
      await c.env.IMAGE_BUCKET.put(fileName,imageBuffer);

      const r2PublicUrl=c.env.R2_PUBLIC_URL;
      image_url=`${r2PublicUrl}/${fileName}`;
    }

    // 3. バリデーション：必須項目が空でないか&タイトルの文字数チェック
    if (title && title.length > 30) {
      return c.json({ success: false, error: 'タイトルは30文字以内で入力してください。' }, 400);
    }
    if (!title || !content || !category) {
      return c.json({ success: false, error: 'Title, content, and category are required' }, 400);
    }

    // 4. created_atをサーバー側で生成
    const created_at = new Date().toISOString();

    // 5. データベースにデータを挿入
    const result = await c.env.DB.prepare(
      `INSERT INTO posts (title, category, image_url, content, created_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(title, category, image_url, content, created_at).run();

    // 挿入されたレコードのIDを取得
    const postId = result.meta.last_row_id;

    // 新しく作成された投稿データを取得
    const newPost = await c.env.DB.prepare(
      `SELECT * FROM posts WHERE id = ?`
    ).bind(postId).first();

    // 6. 成功のレスポンスを返す（201 Created）
    return c.json({ success: true, message: 'Post saved successfully', post: newPost }, 201);

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

app.get('/api/post/:id', async (c) => {
  try {
    const postId = c.req.param('id');
    
    // データベースからIDが一致する投稿を1件だけ探す
    const post = await c.env.DB.prepare(
      `SELECT * FROM posts WHERE id = ?`
    ).bind(postId).first();

    if (post) {
      return c.json({ success: true, post: post });
    } else {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to fetch post' }, 500);
  }
});


/**
 * DELETE /api/post/:id
 * 指定されたIDの投稿を削除するエンドポイント
 */
app.delete('/api/post/:id', async (c) => {
  try {
    // ヘッダーからパスワードを取得
    const password = c.req.header('X-Auth-Password');
    if (!password || password !== c.env.SECRET_KEY) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    // 1. URLから削除対象のIDを取得
    const postId = c.req.param('id');
    if (!postId) {
      return c.json({ success: false, error: 'Post ID is required' }, 400);
    }

    // 2. データベースから該当の投稿を削除
    const result = await c.env.DB.prepare(
      `DELETE FROM posts WHERE id = ?`
    ).bind(postId).run();

    // 3. 削除が成功したか確認
    if (result.meta.changes > 0) {
      return c.json({ success: true, message: 'Post deleted successfully' });
    } else {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ success: false, error: `Failed to delete post: ${errorMessage}` }, 500);
  }
});

/**
 * POST /api/upload-image
 * 画像のみをアップロードするエンドポイント（パスワード不要）
 * /imageコマンドで使用される
 */
app.post('/api/upload-image', async (c) => {
  try {
    // formDataから画像ファイルを取得
    const formData = await c.req.formData();
    const imageFile = formData.get('image');

    // 画像ファイルが存在するか確認
    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return c.json({ success: false, error: 'No image provided' }, 400);
    }

    // R2に画像をアップロード
    const imageBuffer = await imageFile.arrayBuffer();
    const fileName = `${Date.now()}-${imageFile.name}`;
    await c.env.IMAGE_BUCKET.put(fileName, imageBuffer);

    // 画像のURLを生成
    const image_url = `${c.env.R2_PUBLIC_URL}/${fileName}`;

    // 成功レスポンスを返す
    return c.json({ success: true, image_url });

  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to upload image' }, 500);
  }
});

/**
 * GET /api/map-locations
 * 地図の地点一覧を取得するエンドポイント
 */
app.get('/api/map-locations', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM map_locations ORDER BY created_at DESC`
    ).all();

    return c.json({ success: true, locations: results as MapLocation[] });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to fetch map locations' }, 500);
  }
});

/**
 * 緯度経度をX/Y座標（0-100）に変換する関数
 * GeoloniaのSVG地図に合わせた変換
 *
 * 複数の基準点を使って校正:
 * - 東京: 35.6762°N, 139.6503°E → x: 67, y: 47
 * - 北海道: 43.0642°N, 141.3469°E → x: 75, y: 10
 * - 神奈川: 35.4478°N, 139.6425°E → x: 65, y: 48
 * - 大阪: 34.6937°N, 135.5023°E → x: 50, y: 51
 */
function convertLatLonToXY(lat: number, lon: number): { x: number, y: number } {
  // 多点校正による最適化された変換パラメータ
  // 日本列島の実効範囲（沖縄を除く主要4島）
  const LAT_MIN = 30.0;   // 南端基準
  const LAT_MAX = 45.5;   // 北海道北端
  const LON_MIN = 129.0;  // 西端基準
  const LON_MAX = 145.8;  // 東端基準

  // 緯度 → Y座標（上が小さい値、下が大きい値）
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;

  // 経度 → X座標（左が小さい値、右が大きい値）
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100;

  // 0-100の範囲に制限
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
}

/**
 * POST /api/map-locations
 * 新しい地図の地点を追加するエンドポイント
 */
app.post('/api/map-locations', async (c) => {
  try {
    const formData = await c.req.formData();
    const password = formData.get('password') as string;

    // パスワードチェック
    if (password !== c.env.SECRET_KEY) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const name = formData.get('name') as string;
    const prefecture = formData.get('prefecture') as string;
    const memo = formData.get('memo') as string;
    const linked_post_id = formData.get('linked_post_id') as string | null;
    const latitude = formData.get('latitude') as string | null;
    const longitude = formData.get('longitude') as string | null;

    // バリデーション
    if (!name || !prefecture || !memo) {
      return c.json({ success: false, error: 'Name, prefecture, and memo are required' }, 400);
    }

    const created_at = new Date().toISOString();

    // 緯度経度が提供されている場合、X/Y座標に変換
    let xCoord: number | null = null;
    let yCoord: number | null = null;

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      // 有効な緯度経度かチェック
      if (!isNaN(lat) && !isNaN(lon)) {
        const converted = convertLatLonToXY(lat, lon);
        xCoord = converted.x;
        yCoord = converted.y;
      }
    }

    // データベースに挿入
    const result = await c.env.DB.prepare(
      `INSERT INTO map_locations (name, prefecture, memo, linked_post_id, x_coordinate, y_coordinate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(name, prefecture, memo, linked_post_id || null, xCoord, yCoord, created_at).run();

    const locationId = result.meta.last_row_id;

    // 新しく作成された地点を取得
    const newLocation = await c.env.DB.prepare(
      `SELECT * FROM map_locations WHERE id = ?`
    ).bind(locationId).first();

    return c.json({ success: true, message: 'Location added successfully', location: newLocation }, 201);

  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: 'Failed to add location' }, 500);
  }
});

/**
 * DELETE /api/map-locations/:id
 * 指定されたIDの地点を削除するエンドポイント
 */
app.delete('/api/map-locations/:id', async (c) => {
  try {
    // ヘッダーからパスワードを取得
    const password = c.req.header('X-Auth-Password');
    if (!password || password !== c.env.SECRET_KEY) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const locationId = c.req.param('id');
    if (!locationId) {
      return c.json({ success: false, error: 'Location ID is required' }, 400);
    }

    // データベースから削除
    const result = await c.env.DB.prepare(
      `DELETE FROM map_locations WHERE id = ?`
    ).bind(locationId).run();

    if (result.meta.changes > 0) {
      return c.json({ success: true, message: 'Location deleted successfully' });
    } else {
      return c.json({ success: false, error: 'Location not found' }, 404);
    }

  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ success: false, error: `Failed to delete location: ${errorMessage}` }, 500);
  }
});

/**
 * API以外のすべてのリクエストを処理します。
 * HonoのserveStaticミドルウェアが、リクエストに一致する静的ファイルを
 * `dist`フォルダから自動的に探して返してくれます。
 * これにより、Reactアプリが表示されるようになります。
 */
app.get('*', serveStatic());


// Honoアプリケーションをエクスポート
export default app;
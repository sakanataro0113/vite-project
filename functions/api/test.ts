// /functions/api/test.ts
import { Hono } from 'hono';
const app = new Hono();

// POSTリクエストが来たら、単純なテキストを返すだけの機能
app.post('/', (c) => {
  return c.text('Test POST request was successful!');
});

export default app;
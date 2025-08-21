import {Hono} from 'hono'
import { D1Database }  from '@cloudflare/workers-types'

type Bindings={
    DB:D1Database;
}

const app=new Hono<{Bindings:{DB:D1Database}}>();

app.get('/api/')

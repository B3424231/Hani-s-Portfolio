import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { handleRequest } from '../server/index.mjs'

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const port = Number(process.env.PORT ?? '5173')
const host = '127.0.0.1'

const vite = await createViteServer({
  appType: 'spa',
  root: rootDir,
  server: {
    hmr: {
      server: undefined,
    },
    middlewareMode: true,
  },
})

const server = createHttpServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (requestUrl.pathname.startsWith('/api') || requestUrl.pathname.startsWith('/uploads')) {
    handleRequest(request, response)
    return
  }

  vite.middlewares(request, response)
})

server.listen(port, host, () => {
  console.log(`Portfolio dev server running on http://${host}:${port}`)
})

function closeServer() {
  server.close()
  void vite.close()
}

process.on('SIGINT', () => {
  closeServer()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeServer()
  process.exit(0)
})

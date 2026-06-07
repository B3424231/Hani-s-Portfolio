import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')
const dataDir = join(rootDir, 'data')
const uploadsDir = join(dataDir, 'uploads')
const distDir = join(rootDir, 'dist')
const dbPath = join(dataDir, 'portfolio.sqlite')
const port = Number(process.env.PORTFOLIO_API_PORT ?? process.env.PORT ?? 4174)
const pepper = process.env.PORTFOLIO_PEPPER ?? 'hani-portfolio-local-pepper'
const sessions = new Map()

mkdirSync(uploadsDir, { recursive: true })

const db = new DatabaseSync(dbPath)
db.exec('PRAGMA foreign_keys = ON')

const seedAdmin = {
  fullName: 'Honey Mariel Corpuz',
  birthday: 'June 21, 2006',
}

const seedPortfolio = {
  profile: {
    name: 'Hani Noor',
    role: 'UX/UI Designer',
    imageUrl: '',
  },
  about: {
    heading: 'About Me',
    text: 'I design clear, human-centered digital products for teams that need clean flows, calm interfaces, and polished prototypes. Recent work includes dashboards, onboarding systems, and design audits for growing product teams.',
    resumeUrl: '',
    imageUrl: '',
  },
  skills: [
    { label: 'UI Design', value: 88 },
    { label: 'UX Research', value: 76 },
    { label: 'Figma', value: 82 },
    { label: 'Prototyping', value: 74 },
    { label: 'HTML / CSS', value: 59 },
    { label: 'User Testing', value: 58 },
  ],
  experiences: [
    {
      role: 'Senior UX/UI Designer',
      company: 'NovaLane Studio',
      period: '2023 - Present',
      copy: 'Leading product discovery, interface systems, and prototype reviews for SaaS teams.',
      imageUrl: '',
    },
    {
      role: 'UX Designer',
      company: 'BrightGrid Labs',
      period: '2020 - 2023',
      copy: 'Mapped customer journeys, tested new onboarding flows, and improved dashboard clarity.',
      imageUrl: '',
    },
    {
      role: 'UI Designer',
      company: 'Pixel Harbor',
      period: '2018 - 2020',
      copy: 'Created mobile-first screens, visual guidelines, and reusable campaign components.',
      imageUrl: '',
    },
  ],
  projects: [
    {
      title: 'CareFlow Portal',
      copy: 'A low-friction patient intake dashboard for clinic coordinators.',
      imageUrl: '',
      imageUrls: [],
      linkText: 'View Project',
    },
    {
      title: 'MintPay Wallet',
      copy: 'A calm finance app concept with quick transfers and savings goals.',
      imageUrl: '',
      imageUrls: [],
      linkText: 'View Project',
    },
    {
      title: 'Studio Ops Board',
      copy: 'A planning workspace for creative teams managing launches.',
      imageUrl: '',
      imageUrls: [],
      linkText: 'View Project',
    },
  ],
}

function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT NOT NULL,
      birthday_label TEXT NOT NULL,
      salt TEXT NOT NULL,
      credential_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS about (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      heading TEXT NOT NULL,
      body TEXT NOT NULL,
      resume_url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      value INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      company TEXT NOT NULL,
      period TEXT NOT NULL,
      body TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      image_urls TEXT NOT NULL DEFAULT '[]',
      link_text TEXT NOT NULL DEFAULT 'View Project',
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  ensureColumn('projects', 'image_urls', "TEXT NOT NULL DEFAULT '[]'")
  db.prepare("UPDATE projects SET link_text = 'View Project' WHERE link_text = 'View Case Study'").run()
  db.prepare('SELECT id, image_url AS imageUrl, image_urls AS imageUrls FROM projects')
    .all()
    .forEach((project) => {
      if (project.imageUrl && parseImageUrls(project.imageUrls).length === 0) {
        db.prepare('UPDATE projects SET image_urls = ? WHERE id = ?').run(
          JSON.stringify([project.imageUrl]),
          project.id,
        )
      }
    })

  const seededAdmin = db.prepare('SELECT * FROM admins WHERE id = 1').get()

  if (!seededAdmin) {
    const salt = randomBytes(16).toString('hex')
    db.prepare(`
      INSERT INTO admins (id, full_name, birthday_label, salt, credential_hash)
      VALUES (1, ?, ?, ?, ?)
    `).run(
      seedAdmin.fullName,
      seedAdmin.birthday,
      salt,
      hashCredential(seedAdmin.fullName, seedAdmin.birthday, salt),
    )
  } else if (
    normalizeCredential(seededAdmin.full_name) !== normalizeCredential(seedAdmin.fullName) ||
    normalizeCredential(seededAdmin.birthday_label) !== normalizeCredential(seedAdmin.birthday)
  ) {
    const salt = randomBytes(16).toString('hex')
    db.prepare(`
      UPDATE admins
      SET full_name = ?, birthday_label = ?, salt = ?, credential_hash = ?
      WHERE id = 1
    `).run(
      seedAdmin.fullName,
      seedAdmin.birthday,
      salt,
      hashCredential(seedAdmin.fullName, seedAdmin.birthday, salt),
    )
  }

  if (!db.prepare('SELECT id FROM profile WHERE id = 1').get()) {
    db.prepare(`
      INSERT INTO profile (id, name, role, image_url)
      VALUES (1, ?, ?, ?)
    `).run(seedPortfolio.profile.name, seedPortfolio.profile.role, seedPortfolio.profile.imageUrl)
  }

  if (!db.prepare('SELECT id FROM about WHERE id = 1').get()) {
    db.prepare(`
      INSERT INTO about (id, heading, body, resume_url, image_url)
      VALUES (1, ?, ?, ?, ?)
    `).run(
      seedPortfolio.about.heading,
      seedPortfolio.about.text,
      seedPortfolio.about.resumeUrl,
      seedPortfolio.about.imageUrl,
    )
  }

  if (db.prepare('SELECT COUNT(*) AS count FROM skills').get().count === 0) {
    const insertSkill = db.prepare(`
      INSERT INTO skills (label, value, sort_order)
      VALUES (?, ?, ?)
    `)
    seedPortfolio.skills.forEach((skill, index) => {
      insertSkill.run(skill.label, skill.value, index)
    })
  }

  if (db.prepare('SELECT COUNT(*) AS count FROM experiences').get().count === 0) {
    const insertExperience = db.prepare(`
      INSERT INTO experiences (role, company, period, body, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    seedPortfolio.experiences.forEach((experience, index) => {
      insertExperience.run(
        experience.role,
        experience.company,
        experience.period,
        experience.copy,
        experience.imageUrl,
        index,
      )
    })
  }

  if (db.prepare('SELECT COUNT(*) AS count FROM projects').get().count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (title, body, image_url, image_urls, link_text, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    seedPortfolio.projects.forEach((project, index) => {
      insertProject.run(
        project.title,
        project.copy,
        project.imageUrl,
        JSON.stringify(project.imageUrls),
        project.linkText,
        index,
      )
    })
  }
}

function ensureColumn(tableName, columnName, definition) {
  const hasColumn = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName)

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
  }
}

function normalizeCredential(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function birthdayVariants(value) {
  const raw = String(value ?? '').trim()
  const variants = new Set([raw])
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)

  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    variants.add(
      new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date),
    )
  }

  if (slashMatch) {
    const [, month, day, year] = slashMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    variants.add(
      new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date),
    )
  }

  variants.add(raw.replace(/,\s*/g, ' '))
  variants.add(raw.replace(/\s+/g, ' '))
  return [...variants].filter(Boolean)
}

function hashCredential(fullName, birthday, salt) {
  const secret = `${normalizeCredential(fullName)}|${normalizeCredential(birthday)}|${pepper}`
  return scryptSync(secret, salt, 64).toString('hex')
}

function verifyCredential(fullName, birthday) {
  const admin = db.prepare('SELECT * FROM admins WHERE id = 1').get()
  if (!admin) {
    return false
  }

  const savedHash = Buffer.from(admin.credential_hash, 'hex')
  return birthdayVariants(birthday).some((birthdayVariant) => {
    const attemptedHash = Buffer.from(hashCredential(fullName, birthdayVariant, admin.salt), 'hex')
    return savedHash.length === attemptedHash.length && timingSafeEqual(savedHash, attemptedHash)
  })
}

function readPortfolio() {
  const profile = db.prepare('SELECT name, role, image_url AS imageUrl FROM profile WHERE id = 1').get()
  const about = db
    .prepare('SELECT heading, body AS text, resume_url AS resumeUrl, image_url AS imageUrl FROM about WHERE id = 1')
    .get()
  const skills = db.prepare('SELECT id, label, value FROM skills ORDER BY sort_order, id').all()
  const experiences = db
    .prepare(`
      SELECT id, role, company, period, body AS copy, image_url AS imageUrl
      FROM experiences
      ORDER BY sort_order, id
    `)
    .all()
  const projects = db
    .prepare(`
      SELECT
        id,
        title,
        body AS copy,
        image_url AS imageUrl,
        image_urls AS imageUrlsJson,
        link_text AS linkText
      FROM projects
      ORDER BY sort_order, id
    `)
    .all()
    .map((project) => {
      const imageUrls = parseImageUrls(project.imageUrlsJson, project.imageUrl)
      return {
        id: project.id,
        title: project.title,
        copy: project.copy,
        imageUrl: imageUrls[0] ?? project.imageUrl,
        imageUrls,
        linkText: project.linkText,
      }
    })

  return { profile, about, skills, experiences, projects }
}

function readMessages() {
  return db
    .prepare(`
      SELECT id, email, body AS message, created_at AS createdAt
      FROM messages
      ORDER BY datetime(created_at) DESC, id DESC
    `)
    .all()
}

function createMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Message payload is required.')
  }

  const email = requiredText(payload.email, 'Email')
  const message = requiredText(payload.message, 'Message')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Please enter a valid email address.')
  }

  db.prepare('INSERT INTO messages (email, body) VALUES (?, ?)').run(email, message)
  return { ok: true }
}

function deleteMessage(id) {
  const messageId = Number(id)
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new HttpError(400, 'A valid message id is required.')
  }

  db.prepare('DELETE FROM messages WHERE id = ?').run(messageId)
  return readMessages()
}

function savePortfolio(payload) {
  const data = sanitizePortfolio(payload)

  db.exec('BEGIN')
  try {
    db.prepare('UPDATE profile SET name = ?, role = ?, image_url = ? WHERE id = 1').run(
      data.profile.name,
      data.profile.role,
      data.profile.imageUrl,
    )
    db.prepare('UPDATE about SET heading = ?, body = ?, resume_url = ?, image_url = ? WHERE id = 1').run(
      data.about.heading,
      data.about.text,
      data.about.resumeUrl,
      data.about.imageUrl,
    )

    db.prepare('DELETE FROM skills').run()
    db.prepare('DELETE FROM experiences').run()
    db.prepare('DELETE FROM projects').run()

    const insertSkill = db.prepare(`
      INSERT INTO skills (label, value, sort_order)
      VALUES (?, ?, ?)
    `)
    data.skills.forEach((skill, index) => {
      insertSkill.run(skill.label, skill.value, index)
    })

    const insertExperience = db.prepare(`
      INSERT INTO experiences (role, company, period, body, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    data.experiences.forEach((experience, index) => {
      insertExperience.run(
        experience.role,
        experience.company,
        experience.period,
        experience.copy,
        experience.imageUrl,
        index,
      )
    })

    const insertProject = db.prepare(`
      INSERT INTO projects (title, body, image_url, image_urls, link_text, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    data.projects.forEach((project, index) => {
      insertProject.run(
        project.title,
        project.copy,
        project.imageUrl,
        JSON.stringify(project.imageUrls),
        project.linkText,
        index,
      )
    })

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return readPortfolio()
}

function sanitizePortfolio(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Portfolio payload is required.')
  }

  return {
    profile: {
      name: requiredText(payload.profile?.name, 'Profile name'),
      role: requiredText(payload.profile?.role, 'Profile role'),
      imageUrl: optionalText(payload.profile?.imageUrl),
    },
    about: {
      heading: requiredText(payload.about?.heading, 'About heading'),
      text: requiredText(payload.about?.text, 'About text'),
      resumeUrl: optionalText(payload.about?.resumeUrl),
      imageUrl: optionalText(payload.about?.imageUrl),
    },
    skills: asArray(payload.skills).map((skill) => ({
      label: requiredText(skill.label, 'Skill label'),
      value: boundedNumber(skill.value, 0, 100, 'Skill value'),
    })),
    experiences: asArray(payload.experiences).map((experience) => ({
      role: requiredText(experience.role, 'Experience role'),
      company: requiredText(experience.company, 'Experience company'),
      period: requiredText(experience.period, 'Experience period'),
      copy: requiredText(experience.copy, 'Experience description'),
      imageUrl: optionalText(experience.imageUrl),
    })),
    projects: asArray(payload.projects).map((project) => {
      const imageUrl = optionalText(project.imageUrl)
      const imageUrls = uniqueTextArray([
        ...asArray(project.imageUrls),
        ...(imageUrl ? [imageUrl] : []),
      ])

      return {
        title: requiredText(project.title, 'Project title'),
        copy: requiredText(project.copy, 'Project description'),
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
        linkText: optionalText(project.linkText) || 'View Project',
      }
    }),
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function requiredText(value, label) {
  const text = optionalText(value)
  if (!text) {
    throw new HttpError(400, `${label} is required.`)
  }
  return text
}

function optionalText(value) {
  return String(value ?? '').trim()
}

function uniqueTextArray(values) {
  return [...new Set(values.map(optionalText).filter(Boolean))]
}

function parseImageUrls(value, fallback = '') {
  try {
    const parsed = JSON.parse(String(value || '[]'))
    const imageUrls = uniqueTextArray(Array.isArray(parsed) ? parsed : [])
    const fallbackUrl = optionalText(fallback)
    return fallbackUrl ? uniqueTextArray([fallbackUrl, ...imageUrls]) : imageUrls
  } catch {
    const fallbackUrl = optionalText(fallback)
    return fallbackUrl ? [fallbackUrl] : []
  }
}

function boundedNumber(value, min, max, label) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new HttpError(400, `${label} must be a number.`)
  }
  return Math.max(min, Math.min(max, Math.round(number)))
}

function createSession() {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, Date.now() + 1000 * 60 * 60 * 8)
  return token
}

function requireSession(request) {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expiresAt = sessions.get(token)
  if (!token || !expiresAt || expiresAt < Date.now()) {
    sessions.delete(token)
    throw new HttpError(401, 'Admin login is required.')
  }
}

function uploadAsset(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Upload payload is required.')
  }

  const match = String(payload.dataUrl ?? '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw new HttpError(400, 'A base64 data URL is required.')
  }

  const mimeType = match[1]
  const extension = extensionForMime(mimeType, payload.fileName)
  if (!extension) {
    throw new HttpError(400, 'Only images and PDF resume files are supported.')
  }

  const bytes = Buffer.from(match[2], 'base64')
  const maxBytes = 50 * 1024 * 1024
  if (bytes.length > maxBytes) {
    throw new HttpError(400, 'Uploads must be 50 MB or smaller.')
  }

  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  const safeName = String(payload.fileName ?? 'asset')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const fileName = `${Date.now()}-${digest}-${safeName || 'asset'}${extension}`
  writeFileSync(join(uploadsDir, fileName), bytes)
  return { url: `/uploads/${fileName}` }
}

function extensionForMime(mimeType, fileName) {
  const fromName = extname(String(fileName ?? '')).toLowerCase()
  const byMime = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
  }
  if (byMime[mimeType]) {
    return byMime[mimeType]
  }
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'].includes(fromName) ? fromName : ''
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(data))
}

function sendText(response, status, text) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
  response.end(text)
}

function readJson(request) {
  return new Promise((resolveJson, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 70 * 1024 * 1024) {
        request.destroy()
        reject(new HttpError(413, 'Request body is too large.'))
      }
    })
    request.on('end', () => {
      if (!body) {
        resolveJson({})
        return
      }
      try {
        resolveJson(JSON.parse(body))
      } catch {
        reject(new HttpError(400, 'Invalid JSON payload.'))
      }
    })
    request.on('error', reject)
  })
}

function serveUpload(requestUrl, response) {
  const decodedPath = decodeURIComponent(requestUrl.pathname.replace(/^\/uploads\//, ''))
  const filePath = normalize(join(uploadsDir, decodedPath))
  if (!filePath.startsWith(uploadsDir) || !existsSync(filePath)) {
    sendText(response, 404, 'Not found')
    return
  }

  response.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
  response.end(readFileSync(filePath))
}

function serveDist(requestUrl, response) {
  if (!existsSync(distDir)) {
    sendText(response, 404, 'Run npm run build before serving the production app.')
    return
  }

  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname
  const decodedPath = decodeURIComponent(pathname.replace(/^\//, ''))
  let filePath = normalize(join(distDir, decodedPath))
  if (!filePath.startsWith(distDir) || !existsSync(filePath)) {
    filePath = join(distDir, 'index.html')
  }

  response.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Cache-Control': filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=31536000',
  })
  response.end(readFileSync(filePath))
}

function contentType(filePath) {
  const extension = extname(filePath).toLowerCase()
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.gif': 'image/gif',
      '.html': 'text/html; charset=utf-8',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    }[extension] ?? 'application/octet-stream'
  )
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

setupDatabase()

export async function handleRequest(request, response) {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  try {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      })
      response.end()
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/portfolio') {
      sendJson(response, 200, readPortfolio())
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/admin/login') {
      const payload = await readJson(request)
      if (!verifyCredential(payload.fullName, payload.birthday)) {
        throw new HttpError(401, 'Full name or birthday is incorrect.')
      }
      sendJson(response, 200, { token: createSession(), portfolio: readPortfolio() })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/messages') {
      sendJson(response, 201, createMessage(await readJson(request)))
      return
    }

    if (request.method === 'PUT' && requestUrl.pathname === '/api/admin/portfolio') {
      requireSession(request)
      sendJson(response, 200, savePortfolio(await readJson(request)))
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/admin/messages') {
      requireSession(request)
      sendJson(response, 200, readMessages())
      return
    }

    if (request.method === 'DELETE' && requestUrl.pathname.startsWith('/api/admin/messages/')) {
      requireSession(request)
      sendJson(response, 200, deleteMessage(requestUrl.pathname.split('/').pop()))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/admin/upload') {
      requireSession(request)
      sendJson(response, 201, uploadAsset(await readJson(request)))
      return
    }

    if (request.method === 'GET' && requestUrl.pathname.startsWith('/uploads/')) {
      serveUpload(requestUrl, response)
      return
    }

    if (request.method === 'GET') {
      serveDist(requestUrl, response)
      return
    }

    throw new HttpError(404, 'Not found.')
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    sendJson(response, status, {
      error: error instanceof Error ? error.message : 'Unexpected server error.',
    })
  }
}

export function createPortfolioServer() {
  return createServer(handleRequest)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPortfolioServer().listen(port, () => {
    console.log(`Portfolio API running on http://localhost:${port}`)
  })
}

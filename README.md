# Tahmesk-digital# Tahmesk Digital — Node.js + SQLite Website

A full-stack digital marketing website with a Node.js/Express backend
and SQLite database for contact form submissions and dynamic content.

## Project Structure

```
tahmesk-digital/
├── server.js          ← Express server + all API routes
├── package.json
├── db/
│   ├── init.js        ← Database schema + seed data
│   └── tahmesk.db     ← Auto-created on first run (gitignore this)
└── public/
    └── index.html     ← Frontend (served as static file)
```

## Quick Start

### 1. Install dependencies
```bash
cd tahmesk-digital
npm install
```

### 2. Start the server
```bash
npm start
```

The server starts at **http://localhost:3000**
The database is created and seeded automatically on first run.

---

## API Reference

### Content (site text)

| Method | Endpoint            | Description                  |
|--------|---------------------|------------------------------|
| GET    | /api/content        | Get all editable text as JSON|
| PUT    | /api/content/:key   | Update a content value       |

**Content keys available:**
- `hero_title`, `hero_subtitle`
- `about_text`, `about_text2`
- `vision_text`, `vision_text2`
- `stat_clients`, `stat_employees`, `stat_years`, `stat_awards`
- `contact_address`, `contact_email`, `contact_phone`

**Example — update hero title:**
```bash
curl -X PUT http://localhost:3000/api/content/hero_title \
  -H "Content-Type: application/json" \
  -d '{"value": "Your new headline here"}'
```

---

### Services

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /api/services     | List all services    |
| POST   | /api/services     | Add a new service    |
| PUT    | /api/services/:id | Update a service     |
| DELETE | /api/services/:id | Delete a service     |

**Example — add a service:**
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "icon": "fa-rocket",
    "title": "Growth Hacking",
    "description": "Rapid experimentation across channels.",
    "sort_order": 7
  }'
```

---

### Contacts

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| POST   | /api/contact       | Submit the contact form        |
| GET    | /api/contacts      | View all submissions (admin)   |
| DELETE | /api/contacts/:id  | Delete a submission            |

**Example — view all submissions:**
```bash
curl http://localhost:3000/api/contacts
```

---

## Environment Variables

| Variable | Default | Description        |
|----------|---------|--------------------|
| PORT     | 3000    | Server port number |

```bash
PORT=8080 npm start
```

## Production Tips

- Add authentication middleware to protect `/api/contacts` and PUT/DELETE routes
- Use a process manager like **PM2**: `npm install -g pm2 && pm2 start server.js`
- Place behind **Nginx** as a reverse proxy for HTTPS
- Back up `db/tahmesk.db` regularly (it's a single file — easy to copy)

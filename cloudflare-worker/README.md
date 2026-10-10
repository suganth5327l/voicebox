# Tamil Voice AI Worker

This is the backend for the standalone `index.html` frontend.

## Cloudflare dashboard upload

Create a new **Worker**, not a Pages project. Upload or paste:

```text
cloudflare-worker/src/index.js
```

Then add a binding:

```text
Type: Workers AI
Variable name: AI
```

Deploy the Worker and copy its URL. Update `WORKER_URL` in the root
`index.html` to that URL.

The Worker exposes:

```text
GET  /health
POST /analyze
```

`/analyze` accepts a multipart form field named `audio` and returns the
transcript, detected intent, and extracted form fields.

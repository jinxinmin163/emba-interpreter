# VPS Deployment

## Recommended Setup

Use Docker on an Ubuntu VPS.

```bash
git clone https://github.com/jinxinmin163/emba-interpreter.git
cd emba-interpreter
cp .env.example .env
docker compose up -d --build
```

The app will listen on:

```text
http://YOUR_VPS_IP:4321
```

## Important: Microphone Requires HTTPS

Most browsers only allow microphone and speech recognition on secure origins.

For local testing, `localhost` works. For a public VPS, use a domain with HTTPS, such as:

```text
https://emba.your-domain.com
```

You can use Caddy, Nginx, Cloudflare Tunnel, or another reverse proxy.

## DeepSeek

You can enter the DeepSeek API key directly on the app page. If you prefer server defaults, edit `.env`:

```env
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

## Ollama On VPS

If Ollama is installed directly on the VPS host, keep it listening on port `11434`.

When this app runs in Docker and needs to call host Ollama, use this URL in the app page:

```text
http://host.docker.internal:11434
```

If the app runs directly with Node on the VPS, use:

```text
http://127.0.0.1:11434
```

Install a model:

```bash
ollama pull qwen3:4b
```

Use `qwen3:4b` for lighter VPS machines, `qwen3:8b` for stronger machines.

# VPS Deployment

## Direct Node Setup

```bash
git clone https://github.com/jinxinmin163/emba-interpreter.git
cd emba-interpreter
cp .env.example .env
npm install
npm start
```

The app listens on:

```text
http://YOUR_VPS_IP:4321
```

## Environment

Edit `.env` on the server:

```env
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=4321
```

The browser page does not ask for the API key. It only lets you choose the DeepSeek model.

## Docker Setup

```bash
git clone https://github.com/jinxinmin163/emba-interpreter.git
cd emba-interpreter
cp .env.example .env
docker compose up -d --build
```

## HTTPS

Most browsers only allow microphone and speech recognition on secure origins.

For local testing, `localhost` works. For a public VPS, use a domain with HTTPS through Nginx, Caddy, Cloudflare Tunnel, or another reverse proxy.

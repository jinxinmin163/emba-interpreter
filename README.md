# EMBA Live Interpreter

English-taught EMBA classroom assistant.

## Features

- Live English transcript in the browser
- Chinese interpretation powered by DeepSeek
- Automatic teacher-question detection
- Suggested answer in English with a Chinese thinking outline
- DeepSeek model can be changed from the page
- DeepSeek API key is stored on the server, not in the browser

## Local Usage

```bash
pnpm install
cp .env.example .env
pnpm start
```

Open:

```text
http://localhost:4321
```

Chrome or Edge is recommended because speech recognition depends on browser support.

## Environment

```env
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=4321
```

## VPS Deployment

See [DEPLOY.md](DEPLOY.md).

For public VPS use, HTTPS is strongly recommended because browser microphone access normally requires a secure origin.

## Notice

Please confirm that your course, school, and lecturer allow recording, transcription, or AI assistance.

The current version uses browser SpeechRecognition for speech recognition.

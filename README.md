# EMBA Live Interpreter

英授 EMBA 课堂辅助工具。

## Features

- 英文课堂字幕
- 中文传译
- 自动识别老师提问
- 生成可当场发言的英文回答和中文思路
- 传译模型可选择本地 Ollama 或 DeepSeek
- 回答模型也可选择本地 Ollama 或 DeepSeek

## Local Usage

```bash
pnpm install
pnpm start
```

Open:

```text
http://localhost:4321
```

Chrome or Edge is recommended because speech recognition depends on browser support.

## Ollama

Install Ollama and pull a model:

```bash
ollama pull qwen3:4b
```

For better quality on stronger machines:

```bash
ollama pull qwen3:8b
```

Default Ollama URL:

```text
http://127.0.0.1:11434
```

## DeepSeek

You can enter the DeepSeek API key directly on the app page.

Default model:

```text
deepseek-v4-flash
```

## VPS Deployment

See [DEPLOY.md](DEPLOY.md).

For public VPS use, HTTPS is strongly recommended because browser microphone access normally requires a secure origin.

## Notice

Please confirm that your course, school, and lecturer allow recording, transcription, or AI assistance.

The current version uses browser SpeechRecognition for speech recognition. For fully local speech recognition, add Whisper or faster-whisper.

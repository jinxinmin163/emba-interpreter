# EMBA Live Interpreter

英授 EMBA 课堂辅助工具：

- 英文课堂字幕
- 中文传译
- 自动识别老师提问
- 生成可当场发言的英文回答和中文思路
- 中文传译可以选择本地 Ollama 或 DeepSeek
- 老师提问的回答也可以选择本地 Ollama 或 DeepSeek

## 推荐本地模型

默认推荐：

```text
qwen3:8b
```

如果电脑性能较强，可以换成：

```text
qwen3:14b
```

更流畅优先用 `qwen3:4b`，质量优先用 `qwen3:14b`。

## 本地 Ollama 使用方法

1. 安装 Ollama
2. 拉取模型：

```bash
ollama pull qwen3:8b
```

3. 确认 Ollama 正在运行
4. 启动本程序：

```bash
pnpm install
pnpm start
```

5. 打开：

```text
http://localhost:4321
```

页面顶部的“传译模型”可以选择“本地 Ollama”或“DeepSeek”。使用 Ollama 时，模型填 `qwen3:8b`，Ollama 地址保持 `http://127.0.0.1:11434`。

## DeepSeek 回答

页面顶部的“回答模型”也可以选择“本地 Ollama”或“DeepSeek”。使用 DeepSeek 时，输入 API key，模型默认 `deepseek-v4-flash`。

## 注意

请先确认课程、学校和老师允许录音、转写或使用 AI 辅助。

当前版本的语音识别使用浏览器 SpeechRecognition。若要做到“完全本地”的语音识别，需要进一步接入 Whisper / faster-whisper。

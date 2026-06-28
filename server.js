import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4321);

const defaults = {
  translateProvider: process.env.TRANSLATE_PROVIDER || 'ollama',
  answerProvider: process.env.ANSWER_PROVIDER || 'deepseek',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:8b'
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readSettings(req) {
  return {
    apiKey: req.body?.apiKey || process.env.DEEPSEEK_API_KEY,
    baseUrl: req.body?.baseUrl || defaults.deepseekBaseUrl,
    translateProvider: req.body?.translateProvider || defaults.translateProvider,
    translateModel: req.body?.translateModel || defaults.ollamaModel,
    answerProvider: req.body?.answerProvider || defaults.answerProvider,
    answerModel: req.body?.answerModel || defaults.deepseekModel,
    ollamaUrl: req.body?.ollamaUrl || defaults.ollamaUrl
  };
}

async function callDeepSeek(settings, model, messages, temperature) {
  if (!settings.apiKey || settings.apiKey === 'your_api_key_here') {
    throw new Error('Please enter a DeepSeek API key.');
  }

  const client = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl
  });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature
  });

  return response.choices?.[0]?.message?.content?.trim() || '';
}

async function callOllama(settings, model, messages, temperature) {
  let response;
  try {
    response = await fetch(`${settings.ollamaUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature }
      })
    });
  } catch {
    throw new Error(
      `Cannot connect to Ollama at ${settings.ollamaUrl}. Please install/start Ollama and run: ollama pull ${model}`
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const missingModel = typeof data.error === 'string' && data.error.toLowerCase().includes('not found');
    if (missingModel) {
      throw new Error(`Ollama model ${model} is not installed. Please run: ollama pull ${model}`);
    }
    throw new Error(data.error || `Ollama request failed with status ${response.status}.`);
  }

  return data.message?.content?.trim() || '';
}

async function callTaskModel(req, task, messages, temperature) {
  const settings = readSettings(req);
  const provider = task === 'answer' ? settings.answerProvider : settings.translateProvider;
  const model = task === 'answer' ? settings.answerModel : settings.translateModel;

  if (provider === 'deepseek') {
    return callDeepSeek(settings, model, messages, temperature);
  }

  return callOllama(settings, model, messages, temperature);
}

app.post('/api/translate', async (req, res) => {
  const { text, context = '' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing classroom text to translate.' });
  }

  try {
    const translation = await callTaskModel(
      req,
      'translate',
      [
        {
          role: 'system',
          content:
            'You are a professional simultaneous interpreter for an English-taught EMBA class. Translate the lecturer into concise, natural Simplified Chinese. Preserve business terms, names, frameworks, and numbers. Do not explain. If the text is fragmentary, translate only what is clear.'
        },
        {
          role: 'user',
          content: `Recent class context:\n${context.slice(-3000)}\n\nNew lecturer text:\n${text}`
        }
      ],
      0.2
    );

    res.json({ translation });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Translation failed.' });
  }
});

app.post('/api/answer', async (req, res) => {
  const { question, context = '' } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing professor question.' });
  }

  try {
    const answer = await callTaskModel(
      req,
      'answer',
      [
        {
          role: 'system',
          content:
            'You help an EMBA student answer a professor in class. Produce a thoughtful but concise answer. Use English first so the student can speak it aloud, then give a Chinese explanation. If context is insufficient, say so briefly and give a safe, general answer.'
        },
        {
          role: 'user',
          content:
            `Class transcript context:\n${context.slice(-6000)}\n\nProfessor question:\n${question}\n\nReturn in this format:\nEnglish answer:\n...\n\n中文思路:\n...`
        }
      ],
      0.45
    );

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Answer generation failed.' });
  }
});

app.post('/api/test-provider', async (req, res) => {
  try {
    const target = req.body?.target === 'answer' ? 'answer' : 'translate';
    const message = await callTaskModel(
      req,
      target,
      [{ role: 'user', content: 'Reply with OK only.' }],
      0
    );
    res.json({ ok: true, message: message || 'OK' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Connection failed.' });
  }
});

app.listen(port, () => {
  console.log(`EMBA Live Interpreter running at http://localhost:${port}`);
});

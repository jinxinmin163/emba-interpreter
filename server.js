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
  baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readSettings(req) {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || defaults.baseUrl,
    model: req.body?.model || process.env.DEEPSEEK_MODEL || defaults.model
  };
}

async function callDeepSeek(req, messages, temperature) {
  const settings = readSettings(req);
  if (!settings.apiKey || settings.apiKey === 'your_api_key_here') {
    throw new Error('DeepSeek API key is not configured on the server.');
  }

  const client = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseURL
  });

  const response = await client.chat.completions.create({
    model: settings.model,
    messages,
    temperature
  });

  return response.choices?.[0]?.message?.content?.trim() || '';
}

app.post('/api/translate', async (req, res) => {
  const { text, context = '' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing classroom text to translate.' });
  }

  try {
    const translation = await callDeepSeek(
      req,
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
    const answer = await callDeepSeek(
      req,
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
    const message = await callDeepSeek(
      req,
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

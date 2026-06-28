const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const startBtn = document.querySelector('#startBtn');
const stopBtn = document.querySelector('#stopBtn');
const clearBtn = document.querySelector('#clearBtn');
const manualBtn = document.querySelector('#manualBtn');
const answerBtn = document.querySelector('#answerBtn');
const saveSettingsBtn = document.querySelector('#saveSettingsBtn');
const testProviderBtn = document.querySelector('#testProviderBtn');
const manualText = document.querySelector('#manualText');
const modelInput = document.querySelector('#modelInput');
const statusEl = document.querySelector('#status');
const englishStream = document.querySelector('#englishStream');
const translationStream = document.querySelector('#translationStream');
const questionBox = document.querySelector('#questionBox');
const answerBox = document.querySelector('#answerBox');
const translateState = document.querySelector('#translateState');
const answerState = document.querySelector('#answerState');
const listeningDot = document.querySelector('#listeningDot');

const settingsKey = 'emba-deepseek-settings';

let recognition;
let transcript = [];
let translations = [];
let lastQuestion = '';
let shouldListen = false;
let translating = false;
let pendingQueue = Promise.resolve();
let recentFinals = [];

const text = {
  saved: 'Settings saved in this browser.',
  translating: 'Translating...',
  translated: 'Updated',
  translateFail: 'Failed',
  noSpeech: 'Speech recognition is not supported. Use Chrome/Edge, or paste text manually.',
  listening: 'Listening...',
  stopped: 'Stopped.',
  questionReady: 'Question detected. You can generate a class answer.',
  canAnswer: 'Ready',
  noQuestion: 'No question detected yet.',
  answerHint: 'After a question is detected, a suggested classroom answer will appear here.',
  generating: 'Generating...',
  generated: 'Generated'
};

function nowLabel() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(settingsKey) || '{}');
  modelInput.value = saved.model || 'deepseek-v4-flash';
}

function currentSettings() {
  return {
    model: modelInput.value.trim() || 'deepseek-v4-flash'
  };
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(currentSettings()));
  setStatus(text.saved);
}

function addEntry(target, value) {
  target.classList.remove('empty');
  const item = document.createElement('div');
  item.className = 'entry';
  item.innerHTML = `<div class="time">${nowLabel()}</div><div></div>`;
  item.lastElementChild.textContent = value;
  target.appendChild(item);
  target.scrollTop = target.scrollHeight;
}

function setStatus(value) {
  statusEl.textContent = value;
}

function fullContext() {
  return transcript.slice(-40).join('\n');
}

function looksLikeQuestion(value) {
  return /(\?|what|why|how|when|where|who|which|do you|can you|could you|would you|should we|any thoughts|what do you think)/i.test(value);
}

function normalizeSpeech(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRepeatedFinal(value) {
  const normalized = normalizeSpeech(value);
  if (!normalized) return true;

  const now = Date.now();
  recentFinals = recentFinals.filter((item) => now - item.time < 12000);

  const repeated = recentFinals.some((item) => item.normalized === normalized);
  if (!repeated) recentFinals.push({ normalized, time: now });
  return repeated;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ...currentSettings() })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function queueTranslation(value) {
  pendingQueue = pendingQueue.then(async () => {
    translating = true;
    translateState.textContent = text.translating;
    try {
      const data = await postJson('/api/translate', { text: value, context: fullContext() });
      translations.push(data.translation);
      addEntry(translationStream, data.translation);
      translateState.textContent = text.translated;
    } catch (error) {
      translateState.textContent = text.translateFail;
      addEntry(translationStream, error.message);
    } finally {
      translating = false;
    }
  });
}

function processFinalText(value, options = {}) {
  const clean = value.trim();
  if (!clean) return;
  if (options.dedupe && isRepeatedFinal(clean)) return;

  transcript.push(clean);
  addEntry(englishStream, clean);
  queueTranslation(clean);

  if (looksLikeQuestion(clean)) {
    lastQuestion = clean;
    questionBox.classList.remove('empty');
    questionBox.textContent = clean;
    answerBox.classList.add('empty');
    answerBox.textContent = text.questionReady;
    answerBtn.disabled = false;
    answerState.textContent = text.canAnswer;
  }
}

function setupRecognition() {
  if (!SpeechRecognition) {
    setStatus(text.noSpeech);
    startBtn.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    setStatus(text.listening);
    listeningDot.classList.add('active');
  };

  recognition.onerror = (event) => {
    setStatus(`Speech recognition error: ${event.error}`);
  };

  recognition.onend = () => {
    listeningDot.classList.remove('active');
    if (shouldListen) recognition.start();
    else setStatus(text.stopped);
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) processFinalText(result[0].transcript, { dedupe: true });
    }
  };
}

saveSettingsBtn.addEventListener('click', saveSettings);

testProviderBtn.addEventListener('click', async () => {
  saveSettings();
  testProviderBtn.disabled = true;
  setStatus('Testing DeepSeek connection...');
  try {
    const data = await postJson('/api/test-provider', {});
    setStatus(`DeepSeek connection OK: ${data.message}`);
  } catch (error) {
    setStatus(`DeepSeek connection failed: ${error.message}`);
  } finally {
    testProviderBtn.disabled = false;
  }
});

startBtn.addEventListener('click', () => {
  shouldListen = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  recognition.start();
});

stopBtn.addEventListener('click', () => {
  shouldListen = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  recognition.stop();
});

clearBtn.addEventListener('click', () => {
  transcript = [];
  translations = [];
  lastQuestion = '';
  recentFinals = [];
  englishStream.textContent = '';
  translationStream.textContent = '';
  questionBox.className = 'question empty';
  questionBox.textContent = text.noQuestion;
  answerBox.className = 'answer empty';
  answerBox.textContent = text.answerHint;
  answerBtn.disabled = true;
  translateState.textContent = translating ? text.translating : 'Idle';
  answerState.textContent = 'Idle';
});

manualBtn.addEventListener('click', () => {
  processFinalText(manualText.value);
  manualText.value = '';
});

answerBtn.addEventListener('click', async () => {
  if (!lastQuestion) return;
  answerBtn.disabled = true;
  answerState.textContent = text.generating;
  answerBox.classList.remove('empty');
  answerBox.textContent = text.generating;
  try {
    const data = await postJson('/api/answer', { question: lastQuestion, context: fullContext() });
    answerBox.textContent = data.answer;
    answerState.textContent = text.generated;
  } catch (error) {
    answerBox.textContent = error.message;
    answerState.textContent = text.translateFail;
  } finally {
    answerBtn.disabled = false;
  }
});

loadSettings();
setupRecognition();

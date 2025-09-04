// Simple AI service abstraction with provider selection
// Note: Replace fetch endpoints with real provider APIs

export async function solveQuestion(content, type = 'auto', subject = 'auto') {
  const { provider, openaiKey, anthropicKey } = await chrome.storage.sync.get(['provider','openaiKey','anthropicKey']);
  const providerName = provider || 'OpenAI';
  const prompt = buildPrompt(content, type, subject);
  try {
    if (providerName === 'OpenAI' && openaiKey) {
      return callOpenAI(prompt, openaiKey);
    }
    if (providerName === 'Claude' && anthropicKey) {
      return callClaude(prompt, anthropicKey);
    }
    // Fallback: echo + simple heuristic
    return Promise.resolve({
      provider: providerName,
      content: `AI (mock) response for: ${content.substring(0, 400)}`,
      type,
      subject
    });
  } catch (e) {
    return { provider: providerName, content: `Error: ${e?.message || e}`, type, subject };
  }
}

function buildPrompt(content, type, subject){
  return `You are an expert tutor. Subject: ${subject}. Type: ${type}. Provide step-by-step solution, with clear formatting, and highlight important steps.\n\nQuestion:\n${content}`;
}

async function callOpenAI(prompt, key){
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful, rigorous tutor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || 'No response';
  return { provider: 'OpenAI', content, type: 'auto', subject: 'auto' };
}

async function callClaude(prompt, key){
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 800,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await res.json();
  const content = data?.content?.[0]?.text || 'No response';
  return { provider: 'Claude', content, type: 'auto', subject: 'auto' };
}

// expose in window for HTML imports
if (typeof window !== 'undefined') {
  window.aiService = { solveQuestion };
}



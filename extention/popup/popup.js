/* global marked, hljs */
(function(){
  const questionEl = document.getElementById('question');
  const solveBtn = document.getElementById('solveBtn');
  const subjectEl = document.getElementById('subject');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');

  solveBtn.addEventListener('click', async () => {
    const text = questionEl.value.trim();
    if (!text) return;
    setStatus('Solving...');
    resultEl.innerHTML = '';
    try {
      const ai = await import(chrome.runtime.getURL('common/aiService.js'));
      const formatter = await import(chrome.runtime.getURL('common/answerFormatter.js'));
      const subject = subjectEl.value;
      const type = subject === 'programming' ? 'coding' : subject;
      const raw = await ai.solveQuestion(text, type, subject);
      const html = formatter.render(raw, subject);
      resultEl.innerHTML = html;
      resultEl.querySelectorAll('pre code').forEach((block)=>hljs.highlightElement(block));
      setStatus('Done');
    } catch (e) {
      console.error(e);
      setStatus('Error');
    }
  });

  function setStatus(msg){ statusEl.textContent = msg; }
})();



export function render(aiResponse, subject = 'auto'){
  const cfg = formatterConfig[subject] || formatterConfig.auto;
  const content = typeof aiResponse === 'string' ? aiResponse : (aiResponse?.content || '');
  let html = '';
  if (cfg.useLatex) {
    html += `<div class="latex">${escapeHtml(content)}</div>`;
  } else {
    html += marked.parse(content);
  }
  if (cfg.syntaxHighlight) {
    // highlighting applied by caller after insertion
  }
  return html;
}

export const formatterConfig = {
  auto: { showSteps: true, useLatex: false, includeGraphs: false, syntaxHighlight: true, runCode: false, explainLogic: true },
  mathematics: { showSteps: true, useLatex: true, includeGraphs: true, syntaxHighlight: false, runCode: false, explainLogic: true },
  programming: { showSteps: true, useLatex: false, includeGraphs: false, syntaxHighlight: true, runCode: false, explainLogic: true },
  writing: { showSteps: false, useLatex: false, includeGraphs: false, syntaxHighlight: false, runCode: false, explainLogic: true }
};

function escapeHtml(s){
  return s
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

if (typeof window !== 'undefined') {
  window.answerFormatter = { render, formatterConfig };
}



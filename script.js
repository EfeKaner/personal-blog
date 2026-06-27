const STORAGE_KEY = 'personal-blog-content';
const passwordConfig = window.__BLOG_CONFIG__?.password;
const PASSWORD = typeof passwordConfig === 'string' && passwordConfig.trim() ? passwordConfig.trim() : 'dev-password';
const defaultContent = [
  'This is your personal blog space. You can edit the text from the button in the bottom-right corner.',
  'The panel is password-protected, so only you can update the content.',
  'Feel free to replace this with your own stories, notes, or ideas.'
].join('\n\n');

const blogContent = document.getElementById('blogContent');
const editButton = document.getElementById('editButton');
const editorPanel = document.getElementById('editorPanel');
const editorText = document.getElementById('editorText');
const saveButton = document.getElementById('saveButton');
const downloadButton = document.getElementById('downloadButton');
const cancelButton = document.getElementById('cancelButton');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderContent(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');

  blogContent.innerHTML = paragraphs;
}

function loadContent() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const text = saved || defaultContent;
  editorText.value = text;
  renderContent(text);
}

function downloadContentFile(text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'blog-content.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

editButton.addEventListener('click', () => {
  const enteredPassword = window.prompt('Enter password to edit the blog');

  if (enteredPassword === null) {
    return;
  }

  if (enteredPassword === PASSWORD) {
    editorPanel.classList.remove('hidden');
    editorText.focus();
  } else {
    window.alert('Incorrect password');
  }
});

saveButton.addEventListener('click', () => {
  const text = editorText.value.trim() || defaultContent;
  localStorage.setItem(STORAGE_KEY, text);
  renderContent(text);
  editorPanel.classList.add('hidden');
});

downloadButton.addEventListener('click', () => {
  const text = editorText.value.trim() || defaultContent;
  downloadContentFile(text);
});

cancelButton.addEventListener('click', () => {
  editorPanel.classList.add('hidden');
});

window.addEventListener('DOMContentLoaded', loadContent);

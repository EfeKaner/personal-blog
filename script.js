const STORAGE_KEY = 'personal-blog-content';
const passwordConfig = window.__BLOG_CONFIG__?.password;
const PASSWORD = typeof passwordConfig === 'string' && passwordConfig.trim() ? passwordConfig.trim() : 'quietcorner2026!';
const defaultTitle = 'Welcome to my quiet corner of the web';
const defaultSubtitle = 'By Efe · Updated recently';
const defaultContent = [
  'This is your personal blog space. You can edit the text from the button in the bottom-right corner.',
  'The panel is password-protected, so only you can update the content.',
  'Feel free to replace this with your own stories, notes, or ideas.'
].join('\n\n');

const defaultState = {
  title: defaultTitle,
  subtitle: defaultSubtitle,
  content: defaultContent
};

const blogContent = document.getElementById('blogContent');
const editButton = document.getElementById('editButton');
const editorPanel = document.getElementById('editorPanel');
const editorText = document.getElementById('editorText');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const saveButton = document.getElementById('saveButton');
const downloadButton = document.getElementById('downloadButton');
const cancelButton = document.getElementById('cancelButton');
const blogTitle = document.querySelector('.blog-title');
const blogMeta = document.querySelector('.blog-meta');
const toolbarButtons = document.querySelectorAll('.chip-button');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStoredState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return { ...defaultState };
  }

  try {
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') {
      return {
        title: parsed.title || defaultTitle,
        subtitle: parsed.subtitle || defaultSubtitle,
        content: parsed.content || defaultContent
      };
    }
  } catch (error) {
    console.warn('Could not parse saved blog state:', error);
  }

  return {
    title: defaultTitle,
    subtitle: defaultSubtitle,
    content: saved || defaultContent
  };
}

function renderContent(state) {
  const currentState = state || getStoredState();
  blogTitle.textContent = currentState.title;
  blogMeta.textContent = currentState.subtitle;

  const paragraphs = currentState.content
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('## ')) {
        return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  blogContent.innerHTML = paragraphs;
}

function loadContent() {
  const state = getStoredState();
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  editorText.value = state.content;
  renderContent(state);
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

function insertMarkdownTag(prefix) {
  const start = editorText.selectionStart;
  const end = editorText.selectionEnd;
  const selectedText = editorText.value.slice(start, end) || 'Başlık';
  const insertion = `${prefix}${selectedText}\n\n`;
  const nextValue = `${editorText.value.slice(0, start)}${insertion}${editorText.value.slice(end)}`;

  editorText.value = nextValue;
  editorText.focus();
  const cursor = start + insertion.length;
  editorText.setSelectionRange(cursor, cursor);
}

editButton.addEventListener('click', () => {
  const enteredPassword = window.prompt('Enter password to edit the blog');

  if (enteredPassword === null) {
    return;
  }

  if (enteredPassword === PASSWORD) {
    const state = getStoredState();
    titleInput.value = state.title;
    subtitleInput.value = state.subtitle;
    editorText.value = state.content;
    editorPanel.classList.remove('hidden');
    editorText.focus();
  } else {
    window.alert('Incorrect password');
  }
});

saveButton.addEventListener('click', () => {
  const state = {
    title: titleInput.value.trim() || defaultTitle,
    subtitle: subtitleInput.value.trim() || defaultSubtitle,
    content: editorText.value.trim() || defaultContent
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderContent(state);
  editorPanel.classList.add('hidden');
});

downloadButton.addEventListener('click', () => {
  const text = editorText.value.trim() || defaultContent;
  downloadContentFile(text);
});

cancelButton.addEventListener('click', () => {
  editorPanel.classList.add('hidden');
});

toolbarButtons.forEach((button) => {
  button.addEventListener('click', () => insertMarkdownTag(button.dataset.insert));
});

window.addEventListener('DOMContentLoaded', loadContent);

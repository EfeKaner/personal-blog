const STORAGE_KEY = 'personal-blog-content';
const CONTENT_URLS = [
  'https://raw.githubusercontent.com/EfeKaner/personal-blog/main/blog-content.md',
  new URL('blog-content.md', window.location.href).href
];
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

let socket = null;
let syncTimer = null;
let isSocketReady = false;
const SYNC_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/ws`;

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeState(state) {
  const baseState = state && typeof state === 'object' ? state : {};

  return {
    title: (baseState.title || defaultTitle).toString().trim() || defaultTitle,
    subtitle: (baseState.subtitle || defaultSubtitle).toString().trim() || defaultSubtitle,
    content: (baseState.content || defaultContent).toString().trim() || defaultContent
  };
}

function getStoredState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return { ...defaultState };
  }

  try {
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') {
      return normalizeState(parsed);
    }
  } catch (error) {
    console.warn('Could not parse saved blog state:', error);
  }

  return normalizeState({ content: saved });
}

function writeStoredState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

function parseContentText(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return null;
  }

  let title = defaultTitle;
  let subtitle = defaultSubtitle;
  let content = trimmedText;

  const frontmatterMatch = trimmedText.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2].trim();
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
    const subtitleMatch = frontmatter.match(/^subtitle:\s*(.+)$/m);

    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    if (subtitleMatch) {
      subtitle = subtitleMatch[1].trim();
    }

    if (body) {
      content = body;
    }
  }

  return { title, subtitle, content };
}

function collectEditorState() {
  return normalizeState({
    title: titleInput.value,
    subtitle: subtitleInput.value,
    content: editorText.value
  });
}

function applyState(state, options = {}) {
  const nextState = normalizeState(state);
  writeStoredState(nextState);
  renderContent(nextState);

  if (!options.silent) {
    titleInput.value = nextState.title;
    subtitleInput.value = nextState.subtitle;
    editorText.value = nextState.content;
  }

  return nextState;
}

function broadcastState(state) {
  const nextState = normalizeState(state);
  writeStoredState(nextState);
  renderContent(nextState);

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectToSyncServer();
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'update', state: nextState }));
  }

  return nextState;
}

function scheduleStateBroadcast() {
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    broadcastState(collectEditorState());
  }, 250);
}

function connectToSyncServer() {
  if (socket || typeof WebSocket === 'undefined') {
    return;
  }

  socket = new WebSocket(SYNC_URL);

  socket.addEventListener('open', () => {
    isSocketReady = true;
    socket.send(JSON.stringify({ type: 'request-state' }));
  });

  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload?.type === 'state' && payload.state) {
        applyState(payload.state, { silent: true });
      }
    } catch (error) {
      console.warn('Could not parse sync payload:', error);
    }
  });

  socket.addEventListener('close', () => {
    isSocketReady = false;
    socket = null;
  });
}

async function loadContentFromSource() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return normalizeState(parsed);
      }
    } catch (error) {
      console.warn('Could not parse saved blog state:', error);
    }
  }

  for (const url of CONTENT_URLS) {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Unable to load ${url}: ${response.status}`);
      }

      const parsedState = parseContentText(await response.text());

      if (parsedState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedState));
        return parsedState;
      }
    } catch (error) {
      console.warn(`Could not load blog content from ${url}:`, error);
    }
  }

  return getStoredState();
}

function buildMarkdownContent(state) {
  const title = (state.title || defaultTitle).replace(/\n/g, ' ');
  const subtitle = (state.subtitle || defaultSubtitle).replace(/\n/g, ' ');
  const content = (state.content || defaultContent).trim();

  return `---\ntitle: ${title}\nsubtitle: ${subtitle}\n---\n\n${content}\n`;
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

async function loadContent() {
  const state = await loadContentFromSource();
  applyState(state, { silent: true });
  connectToSyncServer();
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
  const state = broadcastState(collectEditorState());
  renderContent(state);
  editorPanel.classList.add('hidden');
  window.alert('Saved globally.');
});

downloadButton.addEventListener('click', () => {
  const text = editorText.value.trim() || defaultContent;
  downloadContentFile(text);
});

cancelButton.addEventListener('click', () => {
  editorPanel.classList.add('hidden');
});

titleInput.addEventListener('input', () => {
  renderContent(collectEditorState());
  scheduleStateBroadcast();
});

subtitleInput.addEventListener('input', () => {
  renderContent(collectEditorState());
  scheduleStateBroadcast();
});

editorText.addEventListener('input', () => {
  renderContent(collectEditorState());
  scheduleStateBroadcast();
});

toolbarButtons.forEach((button) => {
  button.addEventListener('click', () => {
    insertMarkdownTag(button.dataset.insert);
    renderContent(collectEditorState());
    scheduleStateBroadcast();
  });
});

window.addEventListener('DOMContentLoaded', () => {
  loadContent();
});

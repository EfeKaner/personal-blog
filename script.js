const STORAGE_KEY = 'personal-blog-content';
const CONTENT_URLS = [
  'https://raw.githubusercontent.com/EfeKaner/personal-blog/main/blog-content.md',
  new URL('blog-content.md', window.location.href).href
];
const passwordConfig = window.__BLOG_CONFIG__?.password;
const githubTokenConfig = window.__BLOG_CONFIG__?.githubToken;
const repoConfig = window.__BLOG_CONFIG__?.repo;
const PASSWORD = typeof passwordConfig === 'string' && passwordConfig.trim() ? passwordConfig.trim() : 'quietcorner2026!';
const GITHUB_TOKEN = typeof githubTokenConfig === 'string' ? githubTokenConfig.trim() : '';
const REPOSITORY = typeof repoConfig === 'string' && repoConfig.trim() ? repoConfig.trim() : 'EfeKaner/personal-blog';
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

async function loadContentFromSource() {
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

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

async function saveContentToRemote(state) {
  if (!GITHUB_TOKEN || !REPOSITORY) {
    return false;
  }

  const endpoint = `https://api.github.com/repos/${REPOSITORY}/contents/blog-content.md`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  const getResponse = await fetch(endpoint, { headers });

  if (!getResponse.ok) {
    throw new Error(`Unable to read blog file from GitHub: ${getResponse.status}`);
  }

  const fileData = await getResponse.json();
  const markdownContent = buildMarkdownContent(state);
  const putResponse = await fetch(endpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Update blog content',
      content: toBase64(markdownContent),
      sha: fileData.sha
    })
  });

  if (!putResponse.ok) {
    const errorText = await putResponse.text();
    throw new Error(`Unable to save blog file to GitHub: ${putResponse.status} ${errorText}`);
  }

  return true;
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

saveButton.addEventListener('click', async () => {
  const state = {
    title: titleInput.value.trim() || defaultTitle,
    subtitle: subtitleInput.value.trim() || defaultSubtitle,
    content: editorText.value.trim() || defaultContent
  };

  try {
    const remoteSaved = await saveContentToRemote(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderContent(state);
    editorPanel.classList.add('hidden');

    if (remoteSaved) {
      window.alert('Blog saved successfully to the shared content file.');
    } else {
      window.alert('Blog saved locally. Add a GitHub token to sync it to the repository.');
    }
  } catch (error) {
    console.error('Could not save the blog remotely:', error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderContent(state);
    editorPanel.classList.add('hidden');
    window.alert('Blog saved locally, but the remote sync failed.');
  }
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

window.addEventListener('DOMContentLoaded', () => {
  loadContent();
});

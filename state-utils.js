function normalizeState(state) {
  const baseState = state && typeof state === 'object' ? state : {};
  const comments = Array.isArray(baseState.comments) ? baseState.comments : [];

  return {
    title: (baseState.title || 'Welcome to my quiet corner of the web').toString().trim() || 'Welcome to my quiet corner of the web',
    subtitle: (baseState.subtitle || 'By Efe · Updated recently').toString().trim() || 'By Efe · Updated recently',
    content: (baseState.content || ['This is your personal blog space. You can edit the text from the button in the bottom-right corner.', 'The panel is password-protected, so only you can update the content.', 'Feel free to replace this with your own stories, notes, or ideas.'].join('\n\n')).toString().trim() || ['This is your personal blog space. You can edit the text from the button in the bottom-right corner.', 'The panel is password-protected, so only you can update the content.', 'Feel free to replace this with your own stories, notes, or ideas.'].join('\n\n'),
    comments: comments.map((comment) => normalizeComment(comment))
  };
}

function normalizeComment(comment) {
  const baseComment = comment && typeof comment === 'object' ? comment : {};
  const replies = Array.isArray(baseComment.replies) ? baseComment.replies : [];

  return {
    id: baseComment.id || `comment-${Math.random().toString(36).slice(2, 10)}`,
    author: (baseComment.author || 'Anonymous').toString().trim() || 'Anonymous',
    text: (baseComment.text || '').toString().trim(),
    createdAt: baseComment.createdAt || new Date().toISOString(),
    replies: replies.map((reply) => normalizeComment(reply))
  };
}

function addCommentToState(state, input) {
  const nextState = normalizeState(state);
  const sanitizedText = (input?.text || '').toString().trim();
  const sanitizedAuthor = (input?.author || 'Anonymous').toString().trim() || 'Anonymous';

  if (!sanitizedText) {
    return nextState;
  }

  const newComment = {
    id: `comment-${Math.random().toString(36).slice(2, 10)}`,
    author: sanitizedAuthor,
    text: sanitizedText,
    createdAt: new Date().toISOString(),
    replies: []
  };

  if (input?.parentId) {
    const thread = findCommentById(nextState.comments, input.parentId);
    if (thread) {
      thread.replies.push(newComment);
      return nextState;
    }
  }

  nextState.comments.push(newComment);
  return nextState;
}

function clearCommentsFromState(state) {
  const nextState = normalizeState(state);
  nextState.comments = [];
  return nextState;
}

function findCommentById(comments, id) {
  for (const comment of comments) {
    if (comment.id === id) {
      return comment;
    }

    const nestedReply = findCommentById(comment.replies || [], id);
    if (nestedReply) {
      return nestedReply;
    }
  }

  return null;
}

module.exports = {
  normalizeState,
  addCommentToState,
  clearCommentsFromState,
  findCommentById
};

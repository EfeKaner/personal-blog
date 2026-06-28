const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeState, addCommentToState, clearCommentsFromState } = require('../state-utils');

test('adds a reply to an existing comment thread', () => {
  const baseState = normalizeState({
    title: 'My blog',
    subtitle: 'A little corner',
    content: 'Hello world',
    comments: [
      {
        id: 'comment-1',
        author: 'Ada',
        text: 'First comment',
        createdAt: '2026-06-28T00:00:00.000Z',
        replies: []
      }
    ]
  });

  const nextState = addCommentToState(baseState, {
    author: 'Grace',
    text: 'Replying here',
    parentId: 'comment-1'
  });

  assert.equal(nextState.comments[0].replies.length, 1);
  assert.equal(nextState.comments[0].replies[0].text, 'Replying here');
});

test('clears all comments and replies when the blog is edited', () => {
  const baseState = normalizeState({
    title: 'My blog',
    subtitle: 'A little corner',
    content: 'Hello world',
    comments: [
      {
        id: 'comment-1',
        author: 'Ada',
        text: 'First comment',
        createdAt: '2026-06-28T00:00:00.000Z',
        replies: [
          {
            id: 'comment-2',
            author: 'Grace',
            text: 'Nested reply',
            createdAt: '2026-06-28T00:01:00.000Z',
            replies: []
          }
        ]
      }
    ]
  });

  const nextState = clearCommentsFromState(baseState);

  assert.deepEqual(nextState.comments, []);
});

const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  listGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  listPosts,
  createPost,
  listMessages,
  createMessage
} = require('../controllers/group.controller');

const router = express.Router();

router.get('/', listGroups);
router.get('/:groupSlug', getGroup);

router.post('/', authMiddleware, createGroup);
router.post('/:groupId/join', authMiddleware, joinGroup);
router.post('/:groupId/leave', authMiddleware, leaveGroup);

router.get('/:groupId/posts', authMiddleware, listPosts);
router.post('/:groupId/posts', authMiddleware, createPost);

router.get('/:groupId/messages', authMiddleware, listMessages);
router.post('/:groupId/messages', authMiddleware, createMessage);

module.exports = router;

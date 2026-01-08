const { z } = require('zod');
const mongoose = require('mongoose');

const Group = require('../models/Group');
const GroupMembership = require('../models/GroupMembership');
const GroupPost = require('../models/GroupPost');
const GroupMessage = require('../models/GroupMessage');
const Pattern = require('../models/Pattern');
const { buildSlug, withRandomSuffix } = require('../utils/string');

const objectId = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid id' });

const createGroupSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(600).optional().default(''),
  coverImageUrl: z.string().url().optional().or(z.literal('')).default(''),
  tags: z.array(z.string().min(1).max(30)).max(8).optional().default([]),
  featuredPatternIds: z.array(objectId).max(5).optional().default([])
});

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  patternId: objectId.optional(),
  attachments: z.array(z.string().url()).max(5).optional().default([])
});

const messageSchema = z.object({
  body: z.string().min(1).max(1000)
});

const slugifyUnique = async (name) => {
  let candidate = buildSlug(name);
  for (let i = 0; i < 5; i += 1) {
    const exists = await Group.findOne({ slug: candidate });
    if (!exists) return candidate;
    candidate = withRandomSuffix(candidate);
  }
  return `${candidate}-${Date.now().toString(36)}`;
};

const normalizeTags = (tags = []) => {
  return tags
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
};

const toGroupSummary = (group, membershipMap = {}) => {
  const membership = membershipMap[group._id.toString()];
  return {
    id: group._id.toString(),
    name: group.name,
    slug: group.slug,
    description: group.description,
    coverImageUrl: group.coverImageUrl,
    tags: group.tags || [],
    memberCount: group.memberCount || 0,
    postCount: group.postCount || 0,
    messageCount: group.messageCount || 0,
    isMember: Boolean(membership),
    role: membership?.role || null,
    featuredPatterns: (group.featuredPatterns || []).map(p => ({
      id: p._id?.toString?.() || p.toString(),
      title: p.title,
      imageUrl: p.imageUrl,
      author: p.author
    })),
    createdAt: group.createdAt
  };
};

const toPost = (post) => ({
  id: post._id.toString(),
  content: post.content,
  pattern: post.pattern
    ? {
        id: post.pattern._id ? post.pattern._id.toString() : post.pattern.toString(),
        title: post.pattern.title,
        imageUrl: post.pattern.imageUrl || ''
      }
    : null,
  attachments: post.attachments || [],
  author: post.author,
  createdAt: post.createdAt
});

const toMessage = (msg) => ({
  id: msg._id.toString(),
  body: msg.body,
  author: msg.author,
  createdAt: msg.createdAt
});

const listGroups = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const q = (req.query.q || '').trim();
    const query = {};
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const groups = await Group.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'featuredPatterns', select: 'title imageUrl author' });

    let membershipMap = {};
    if (req.user) {
      const memberships = await GroupMembership.find({ user: req.user._id, group: { $in: groups.map(g => g._id) } });
      membershipMap = memberships.reduce((acc, m) => {
        acc[m.group.toString()] = { role: m.role };
        return acc;
      }, {});
    }

    return res.json({ groups: groups.map(g => toGroupSummary(g, membershipMap)) });
  } catch (error) {
    return next(error);
  }
};

const getGroup = async (req, res, next) => {
  try {
    const { groupSlug } = req.params;
    const group = await Group.findOne({ slug: groupSlug })
      .populate({ path: 'featuredPatterns', select: 'title imageUrl author' })
      .lean({ virtuals: true });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membership = req.user
      ? await GroupMembership.findOne({ user: req.user._id, group: group._id })
      : null;

    return res.json({ group: toGroupSummary(group, { [group._id.toString()]: membership ? { role: membership.role } : null }) });
  } catch (error) {
    return next(error);
  }
};

const createGroup = async (req, res, next) => {
  try {
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { name, description, coverImageUrl, tags, featuredPatternIds } = parsed.data;
    const slug = await slugifyUnique(name);

    const featuredPatterns = featuredPatternIds.length
      ? await Pattern.find({ _id: { $in: featuredPatternIds } }).select('_id title imageUrl author')
      : [];

    const group = await Group.create({
      name,
      slug,
      description,
      coverImageUrl,
      tags: normalizeTags(tags),
      featuredPatterns: featuredPatterns.map(p => p._id),
      createdBy: req.user._id,
      moderators: [req.user._id],
      memberCount: 1
    });

    await GroupMembership.create({ user: req.user._id, group: group._id, role: 'owner' });

    const populated = await Group.findById(group._id).populate({ path: 'featuredPatterns', select: 'title imageUrl author' });

    return res.status(201).json({ group: toGroupSummary(populated, { [group._id.toString()]: { role: 'owner' } }) });
  } catch (error) {
    return next(error);
  }
};

const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const existing = await GroupMembership.findOne({ user: req.user._id, group: group._id });
    if (existing) {
      return res.json({ groupId: group._id.toString(), isMember: true });
    }

    await GroupMembership.create({ user: req.user._id, group: group._id, role: 'member' });
    group.memberCount = (group.memberCount || 0) + 1;
    await group.save();

    return res.json({ groupId: group._id.toString(), isMember: true, memberCount: group.memberCount });
  } catch (error) {
    return next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membership = await GroupMembership.findOne({ user: req.user._id, group: group._id });
    if (!membership) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    if (membership.role === 'owner') {
      const ownerCount = await GroupMembership.countDocuments({ group: group._id, role: 'owner' });
      if (ownerCount <= 1) {
        return res.status(400).json({ message: 'Transfer ownership before leaving the group.' });
      }
    }

    await GroupMembership.deleteOne({ _id: membership._id });
    group.memberCount = Math.max(0, (group.memberCount || 1) - 1);
    await group.save();

    return res.json({ groupId: group._id.toString(), isMember: false, memberCount: group.memberCount });
  } catch (error) {
    return next(error);
  }
};

const listPosts = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = await GroupMembership.findOne({ user: req.user._id, group: group._id });
    if (!membership) return res.status(403).json({ message: 'Join the group to view posts.' });

    const posts = await GroupPost.find({ group: group._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'pattern', select: 'title imageUrl' })
      .populate({ path: 'author', select: 'displayName handle avatarUrl' });

    return res.json({ posts: posts.map(toPost) });
  } catch (error) {
    return next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = await GroupMembership.findOne({ user: req.user._id, group: group._id });
    if (!membership) return res.status(403).json({ message: 'Join the group to post.' });

    let pattern = null;
    if (parsed.data.patternId) {
      pattern = await Pattern.findById(parsed.data.patternId).select('_id title imageUrl');
    }

    const post = await GroupPost.create({
      group: group._id,
      author: req.user._id,
      content: parsed.data.content,
      pattern: pattern?._id || null,
      attachments: parsed.data.attachments
    });

    group.postCount = (group.postCount || 0) + 1;
    await group.save();

    const hydrated = await GroupPost.findById(post._id)
      .populate({ path: 'pattern', select: 'title imageUrl' })
      .populate({ path: 'author', select: 'displayName handle avatarUrl' });

    return res.status(201).json({ post: toPost(hydrated) });
  } catch (error) {
    return next(error);
  }
};

const listMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = await GroupMembership.findOne({ user: req.user._id, group: group._id });
    if (!membership) return res.status(403).json({ message: 'Join the group to view chat.' });

    const messages = await GroupMessage.find({ group: group._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'author', select: 'displayName handle avatarUrl' });

    return res.json({ messages: messages.map(toMessage) });
  } catch (error) {
    return next(error);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const membership = await GroupMembership.findOne({ user: req.user._id, group: group._id });
    if (!membership) return res.status(403).json({ message: 'Join the group to chat.' });

    const message = await GroupMessage.create({
      group: group._id,
      author: req.user._id,
      body: parsed.data.body
    });

    group.messageCount = (group.messageCount || 0) + 1;
    await group.save();

    const hydrated = await GroupMessage.findById(message._id).populate({ path: 'author', select: 'displayName handle avatarUrl' });

    return res.status(201).json({ message: toMessage(hydrated) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  listPosts,
  createPost,
  listMessages,
  createMessage
};

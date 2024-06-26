const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

const mongoose = require('mongoose');
const { Schema } = mongoose;

// @route    GET api/posts
// @desc     Get all posts
// @access   Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user', 'username');

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/',
  [auth, [check('title', 'Title is required').not().isEmpty(), check('content', 'Content is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;

    try {
      const newPost = new Post({
        title,
        content
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);


// @route   POST api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id).populate('comments.user', 'username');
      const user = await User.findById(req.user.id).select('-password');

      const newComment = {
        user: req.user.id,
        content: req.body.content,
      };
  
      post.comments.unshift(newComment);
  
      await post.save();
      
      const responseComment = {
        user: {id: req.user.id, username: user.username},
        content: req.body.content,
        _id: post.comments[0]._id,
        date: post.comments[0].date
      };

      res.json(responseComment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/posts/:post_id/comments/:comment_id
// @desc    Delete a comment from a post
// @access  Private (Admin only)
router.delete('/:post_id/comments/:comment_id', auth, async (req, res) => {
    try {
      const post = await Post.findById(req.params.post_id).populate('comments.user', 'username');
      const comment = post.comments.find(comment => comment.id === req.params.comment_id);
  
      if (!comment) {
        return res.status(404).json({ msg: 'Comment does not exist' });
      }
  
      // Check user role
      const user = await User.findById(req.user.id).select('-password');
      if (user.role !== 'admin') {
        return res.status(401).json({ msg: 'User not authorized' });
      }
  
      // Get remove index
      const removeIndex = post.comments.map(comment => comment.id).indexOf(req.params.comment_id);
  
      post.comments.splice(removeIndex, 1);
  
      await post.save();
  
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user', 'username');
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (post.likedBy.includes(req.user.id)) {
      post.likes -= 1;
      post.likedBy.pull(req.user.id);
    } else {
      post.likes += 1;
      post.likedBy.push(req.user.id);
      if (post.dislikedBy.includes(req.user.id)) {
        post.dislikes -= 1;
        post.dislikedBy.pull(req.user.id);
      }
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/posts/:id/dislike
// @desc    Dislike a post
// @access  Private
router.post('/:id/dislike', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.user', 'username');
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    if (post.dislikedBy.includes(req.user.id)) {
      post.dislikes -= 1;
      post.dislikedBy.pull(req.user.id);
    } else {
      post.dislikes += 1;
      post.dislikedBy.push(req.user.id);
      if (post.likedBy.includes(req.user.id)) {
        post.likes -= 1;
        post.likedBy.pull(req.user.id);
      }
    }
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
  
module.exports = router;

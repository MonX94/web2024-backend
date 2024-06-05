const Post = require('../models/Post');

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
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
};

exports.dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
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
};

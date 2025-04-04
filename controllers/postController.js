const User = require("../models/userModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const cloudinary = require("../config/cloudinary");
const formidable = require("formidable");
const mongoose = require("mongoose");

exports.newPost = async (req, res) => {
  try {
    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res
          .status(400)
          .json({ msg: "Error while form parse", err: err.message });
      }
      
      const post = new Post();
      
      if (fields.text) {
        post.content = fields.text;
      }
      
      if (files.media) {
        const file = files.media;
        const fileType = file.mimetype.split('/')[0]; // Get if it's 'image' or 'video'
        
        let uploadOptions = { folder: "Threads_Clone/posts" };
        
        // Add specific options for video uploads
        if (fileType === 'video') {
          uploadOptions = {
            ...uploadOptions,
            resource_type: 'video',
            chunk_size: 6000000, // For larger video files
            eager: [
              { format: 'mp4', transformation: { quality: 'auto' } }
            ]
          };
        }
        
        try {
          const uploadResult = await cloudinary.uploader.upload(
            file.filepath,
            uploadOptions
          );
          
          post.media = uploadResult.secure_url;
          post.public_id = uploadResult.public_id;
          post.media_type = fileType; // Store the type (image or video)
        } catch (uploadError) {
          return res
            .status(400)
            .json({
              msg: `Error uploading ${fileType} to server!`,
              err: uploadError.message,
            });
        }
      }
      
      post.author = req.user._id;
      
      try {
        const newPost = await post.save();
        
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $push: { threads: newPost._id },
          },
          { new: true }
        );
        
        return res.status(200).json({ msg: "Post created!", newPost });
      } catch (saveError) {
        return res
          .status(400)
          .json({ msg: "Post didn't save!", err: saveError.message });
      }
    });
  } catch (err) {
    res
      .status(400)
      .json({ msg: "Error while creating post ", err: err.message });
  }
};

exports.allPost = async (req, res) => {
  try {
    const { page } = req.query;
    let pageNo = page;
    if (!page || page == undefined) {
      pageNo = 1;
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * 3)
      .limit(3)
      .populate({ path: "author", select: "-password" })
      .populate({ path: "likes", select: "-password" })
      .populate({
        path: "comments",
        populate: {
          path: "author",
          model: "user",
        },
      });

    return res.status(200).json({ msg: "post fetched!", posts });
  } catch (err) {
    return res
      .status(400)
      .json({ msg: "Error while fetching all post", err: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const postExists = await Post.findById(id);

    if (!postExists) {
      return res.status(400).json({ msg: "Post do not exists!" });
    }
    // Ensure _id is properly converted to string
    const userId = req.user._id.toString();
    const postAuthorId = postExists.author._id.toString();

    if (userId != postAuthorId) {
      return res
        .status(200)
        .json({ msg: "You are not authorized to delete this post!" });
    }

    if (postExists.media) {
      await cloudinary.uploader.destroy(postExists.public_id, (err, result) => {
        console.log({ err, result });
      });
    }

    await Comment.deleteMany({ _id: { $in: postExists.comments } });
    await User.updateMany(
      {
        $or: [{ threads: id }, { reposts: id }, { replies: id }],
      },
      {
        $pull: {
          threads: id,
          replies: id,
          reposts: id,
        },
      },
      {
        new: true,
      }
    );

    await Post.findByIdAndDelete(id);
    res.status(200).json({ msg: "Post deleted !" });
  } catch (err) {
    return res
      .status(400)
      .json({ msg: "Error while deleting post", err: err.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required" });
    }
    console.log(req.user);
    console.log(req.user._id);
    const post = await Post.findById(id);
    if (!post) {
      return res.status(400).json({ msg: " Post not found! " });
    }

    if (post.likes.includes(req.user._id)) {
      await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user._id } },
        { new: true }
      );
      return res.status(201).json({ msg: "post unliked" });
    } else {
      await Post.findByIdAndUpdate(
        id,
        { $push: { likes: req.user._id } },
        { new: true }
      );
      return res.status(201).json({ msg: "post liked" });
    }
  } catch (err) {
    return res
      .status(200)
      .json({ msg: "Failed to like the post! ", err: err.message });
  }
};

exports.repost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required !" });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(400).json({ msg: "No post found !" });
    }
    const newId = new mongoose.Types.ObjectId(id); //it is for making new objectId("q3454q5234tgwe56324154") like mongoose.id

    if (req.user.reposts.includes(newId)) {
      return res.status(400).json({ msg: " this post is already reposted !" });
    }
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { reposts: post._id },
      },
      { new: true }
    );

    return res.status(200).json({ msg: "Reposted !" });
  } catch (err) {
    return res.status(400).json({ msg: "repost  failed !", err: err.message });
  }
};

exports.singlePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required !" });
    }
    const post = await Post.findById(id)
      .populate({
        path: "author",
        select: "-password",
      })
      .populate({ path: "likes", select: "-password" })
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });

    return res.status(200).json({ msg: "post detail fetched !", post });
  } catch (err) {
    return res
      .status(400)
      .json({ msg: "unable to fetch post detail !", err: err.message });
  }
};

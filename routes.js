const express = require("express");
const {
  signIn,
  login,
  userDetails,
  followUser,
  updateProfile,
  searchUser,
  logOut,
  myInfo,
} = require("./controllers/userControllers");
const {
  newPost,
  allPost,
  deletePost,
  likePost,
  repost,
  singlePost,
} = require("./controllers/postController");

const {
  addComment,
  deleteComment,
} = require("./controllers/commentController");
const auth = require("./middlewares/auth");

const router = express.Router();

router.post("/signup", signIn); 
router.post("/login", login);
router.get("/user/:id", userDetails);
router.put("/user/follow/:id", auth, followUser);
router.put("/update", auth, updateProfile);
router.get("/users/search/:query", auth, searchUser);
router.post("/logout", auth, logOut);
router.get("/myinfo", auth, myInfo);

// Post routes
router.post("/post", auth, newPost);
router.get("/post", auth, allPost);
router.delete("/post/delete/:id", auth, deletePost);
router.put("/post/like/:id", auth, likePost);
router.put("/repost/:id", auth, repost);
router.get("/post/:id", auth, singlePost);

//comment
router.post("/comment/:id", auth, addComment);
router.delete("/comment/:postId/:id", auth, deleteComment);

module.exports = router;

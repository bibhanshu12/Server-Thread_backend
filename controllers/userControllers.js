const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const formidable = require("formidable");

exports.signIn = async (req, res) => {
  try {
    const { userName, password, email, fullName } = req.body;

    if (!userName || !password || !email || !fullName) {
      res.status(400).json({
        msg: "userName,password,email,fullName are required!   ",
        err: err.message,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ user: "User already Registered! Please Login. " });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!hashedPassword) {
      return res.status(400).json({ msg: "Error while hashing Password. " });
    }

    const user = new User({
      userName,
      password: hashedPassword,
      fullName,
      email,
    });

    const saveUser = await user.save();

    if (!saveUser) {
      return res.status(400).json({ user: "Error while saving new User. " });
    }

    const accessToken = jwt.sign(
      { token: saveUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "20d" }
    );

    if (!accessToken) {
      return res.status(400).json({ msg: "Error while generating tokens! " });
    }

    res.cookie("token", accessToken, {
      maxage: 1000 * 60 * 60 * 24 * 20,
      httpOnly: true,
      secure: true,
      partitioned:true,
    });

    res.status(201).json({
      msg: `User Signed in Successfully! hello ${saveUser?.fullName} `,
    });

    // res.send("This is sign in function from controller");
  } catch (err) {
    res.status(400).json({ msg: "Error in Signin! ", err: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and Passowrd are required" });
    }

    const userExists = await User.findOne({ email });

    if (!userExists) {
      return res
        .status(400)
        .json({ msg: "User does not exist! Please Sign Up first." });
    }

    const passwordMatched = await bcrypt.compare(password, userExists.password);

    if (!passwordMatched) {
      return res.status(400).json({ msg: "Incorrect password!" });
    }

    const accessToken = jwt.sign(
      { token: userExists._id },
      process.env.JWT_SECRET,
      { expiresIn: "20d" }
    );
    if (!accessToken) {
      return res.status(400).json({ msg: "Error while creating Token!" });
    }

    res.cookie("token", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 20,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      paritioned:true,
    });

    res.status(200).json({ msg: "User Logged in successfully! " });
  } catch (err) {
    res.status(400).json({ msg: "Error in Login ", err: err.message });
  }
};

//need all controllers!
exports.userDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required!", err: err.message });
    }

    const user = await User.findById(id)
      .select("-password")
      .populate("followers", "-password") // Exclude password from followers
      .populate({
        path: "threads",
        populate: [
          { path: "likes", select: "-password" }, 
          { path: "comments" }, 
          { path: "author", select: "-password" } // Exclude password from authors
        ],
      })
      .populate({ 
        path: "replies", 
        populate: { path: "author", select: "-password" } // Exclude password from reply authors
      })
      .populate({
        path: "reposts",
        populate: [
          { path: "likes", select: "-password" }, 
          { path: "comments" }, 
          { path: "author", select: "-password" } // Exclude password from repost authors
        ],
      });

    res.status(200).json({ msg: "User Details Fetched!", user });
  } catch (err) {
    return res
      .status(400)
      .json({ msg: "error fetching userDetails", err: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.send(400).json({ msg: "Id is required!", err: err.message });
    }

    const userExists = await User.findById(id);
    if (!userExists) {
      res.send(400).json({ msg: "User does't exist", err: err.message });
    }

    if (userExists.followers.includes(req.user._id)) {
      await User.findByIdAndUpdate(
        userExists._id,
        {
          $pull: { followers: req.user._id },
        },
        { new: true }
      );
      return res.status(201).json({ msg: `Unfollowed ${userExists.userName}` });
    }

    await User.findByIdAndUpdate(
      userExists._id,
      {
        $push: { followers: req.user._id },
      },
      { new: true }
    );
    return res.status(201).json({ msg: `Following ${userExists.userName}` });
  } catch (err) {
    return res.send(400).json({ msg: "Error in followUser", err: err.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const userExists = await User.findById(req.user._id);

    if (!userExists) {
      return res
        .status(400)
        .json({ msg: "user not found! ", err: err.message });
    }

    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res
          .status(400)
          .json({ msg: "Error in Formidable ", err: err.message });
      }
      if (fields.text) {
        await User.findByIdAndUpdate(
          req.user._id,
          { bio: fields.text },
          { new: true }
        );
      }
      if (fields.fullName) {
        await User.findByIdAndUpdate(
          req.user._id,
          { fullName: fields.fullName },
          { new: true }
        );
      }
      if (files.media) {
        if (userExists.public_id) {
          await cloudinary.uploader.destroy(userExists.public_id);
        }

        // if(userExists.public_id){
        //   await cloudinary.uploader.destroy(userExists.public_id,(err,result)=>{
        //     console.log(err, result);

        //   })
        // }

        const uploadedImage = await cloudinary.uploader.upload(
          files.media.filepath,
          { folder: "Threads_Clone/Profiles" }
        );
        if (!uploadedImage) {
          return res
            .status(400)
            .json({ msg: "Error while uploading image! ", err: err.message });
        }
        await User.findByIdAndUpdate(
          req.user._id,
          {
            profilePicture: uploadedImage.secure_url,
            public_id: uploadedImage.public_id,
          },
          { new: true }
        );
      }

      res.status(201).json({ msg: "Profile updated successfully !" });
    });
  } catch (err) {
    return res
      .status(400)
      .json({ msg: "updateprofile failed! ", err: err.message });
  }
};

exports.searchUser = async (req, res) => {
  try {
    const { query } = req.params;
    const user = await User.find({
      $or: [
        { userName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
    if (user.length === 0) {
      return res.status(200).json({ msg: "No user found!", user });
    }
    res.status(200).json({ msg: "Searched!", user });
  } catch (err) {
    return res.status(400).json({ msg: "search failed!", err: err.message });
  }
};

exports.logOut = async (req, res) => {
  try {
    console.log("Logout attempt");
    
    // Clear the cookie in multiple ways to ensure it works across browsers

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // optional, for HTTPS only in prod
      sameSite: "strict", // optional, prevents CSRF
    });
    console.log("Cookie cleared");
    return res.status(200).json({ msg: "You logged out!" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(400).json({ msg: "Logout failed!", err: err.message });
  }
};

exports.myInfo = async (req, res) => {
  try {
    res.status(200).json({ me: req.user });
  } catch (err) {
    return res
      .status(400)
      .json({ msg: "Unable to fetch MyInformation", err: err.message });
  }
};

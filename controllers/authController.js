const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    lastName,
    username,
    familyGroupId,
    isSignup,
    isGroupSignup,
  } = req.body;

  // checking user input values
  if (isSignup && (!email || !password || !username || !familyGroupId)) {
    return res.status(401).json({ message: "All fields are required" });
  }

  // /////////////////////////////////////////////
  // Group and User Login
  // /////////////////////////////////////////////
  if (isGroupSignup) {
    const foundUser = await User.findOne({ email: email }).exec();

    const hashedPwd = await bcrypt.hash(password, 10);

    if (foundUser) {
      res.json(401).json({ message: "Email already in uses." });
    }

    const foundGroup = await FamilyGroup.findOne({
      familyGroupId: familyGroupId,
    });

    if (foundGroup) {
      res.json(401).json({
        message: "familyGroupId already taken. Please select another id.",
      });
    }

    const newFamilyGroup = await new FamilyGroup({
      familyGroupId,
      familyLastName: lastName,
      creatorEmail: email,
      password: hashedPwd,
    });

    const newUser = await new User({
      email,
      password: hashedPwd,
      username,
      familyGroupId,
    });

    newFamilyGroup.users.push(newUser._id);

    await newFamilyGroup.save();
    await newUser.save();

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: newUser.username,
          groupCreatorLastname: newFamilyGroup.familyLastName,
          familyGroupId: newUser.familyGroupId,
          email: newUser.email,
          currentUserId: newUser._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30m",
      }
    );

    const refreshToken = jwt.sign(
      { email: newUser.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // accessible only by web server
      secure: true, // a cookie can only be retrieved over ssl or https connection
      sameSite: "None", // cross-site cookies. Cross site is posible. api and site might not be on save server
      maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match refreshToken expire
    });

    return res.json({ accessToken });
  }

  // /////////////////////////////////////////////
  // Signup
  // /////////////////////////////////////////////
  if (isSignup) {
    // check if the email already exists in the db
    const duplicateEmail = await User.findOne({ email: email });
    const foundGroup = await FamilyGroup.findOne({
      familyGroupId: familyGroupId,
    });

    if (duplicateEmail) {
      return res.status(402).json({ message: "Email already exits" });
    }

    if (!foundGroup) {
      return res.status(402).json({ message: "group id does not exist" });
    }
    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password, familyGroupId, email });
    await newUser.save();

    // check the familygroup and add a new user _id to the group users array

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: newUser.username,
          groupCreatorLastname: foundGroup.familyLastName,
          familyGroupId: newUser.familyGroupId,
          email: newUser.email,
          currentUserId: newUser._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30m",
      }
    );

    const refreshToken = jwt.sign(
      { email: newUser.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // accessible only by web server
      secure: true, // a cookie can only be retrieved over ssl or https connection
      sameSite: "None", // cross-site cookies. Cross site is posible. api and site might not be on save server
      maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match refreshToken expire
    });

    return res.json({ accessToken });
  }
  // /////////////////////////////////////////////
  // Login
  // /////////////////////////////////////////////
  if (!isSignup && !isGroupSignup) {
    // check if the email exists already in the users database
    const foundUser = await User.findOne({ email }).exec();
    const unHashedPassword = bcrypt.compare(password, foundUser.password);

    if (!foundUser) return res.status(400).json({ message: "No user found" });
    if (!unHashedPassword)
      return res.status(400).json({ message: "incorrect password" });

    const familyGroup = await FamilyGroup.findOne({
      familyGroupId: foundUser.familyGroupId,
    }).exec();

    if (!familyGroup)
      return res.status(400).json({ message: "Could not find your group" });

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          groupCreatorLastname: familyGroup.familyLastName,
          familyGroupId: foundUser.familyGroupId,
          email: foundUser.email,
          currentUserId: foundUser._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "30m",
      }
    );

    const refreshToken = jwt.sign(
      { email: foundUser.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Create secure cookie with refresh token
    res.cookie("jwt", refreshToken, {
      httpOnly: true, // accessible only by web server
      secure: true, // a cookie can only be retrieved over ssl or https connection
      sameSite: "None", // cross-site cookies. Cross site is posible. api and site might not be on save server
      maxAge: 7 * 24 * 60 * 60 * 1000, // cookie expiry: set to match refreshToken expire
    });

    res.json({ accessToken });
  }
});

// @desc Refresh
// @rooute GET /auth/refresh
// @access Public - becaause access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(403).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({ email: decoded.email }).exec();

      if (!foundUser) return res.status(403).json({ message: "Unauthorized" });

      const foundFamilyGroup = await FamilyGroup.findOne({
        familyGroupId: foundUser.familyGroupId,
      }).exec();

      if (!foundFamilyGroup)
        return res.status(401).json({
          message: "User needs to update Family group id. No group found.",
        });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            groupCreatorLastname: foundFamilyGroup.familyLastName,
            familyGroupId: foundUser.familyGroupId,
            email: foundUser.email,
            currentUserId: foundUser._id,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "30m",
        }
      );
      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @rooute GET /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No Content
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
  return res.json({ message: "Cookie cleared" });
};

module.exports = { login, refresh, logout };

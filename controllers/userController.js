const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const jwt = require("jsonwebtoken");

const asyncHandler = require("express-async-handler");

const bcrypt = require("bcrypt");
const saltRounds = 10;

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(403).json({ message: "getAllUsers Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (token?.UserInfo) {
    return res.status(401).json({ message: "lost the header!" });
  }

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    asyncHandler(async (error, decoded) => {
      const users = await User.find({
        familyGroupId: decoded.UserInfo?.familyGroupId,
      }).exec();

      if (!users) {
        return res.json({ message: "No users found" });
      }

      if (!users?.length) {
        return res.status(400).json({ message: "No Users found" });
      }

      return res.status(200).json(users);
    })
  );
});

// @desc Get all users
// @route Post /users
// @access Private
const createNewUser = asyncHandler(async (req, res, next) => {
  const { username, password, familyGroupId, email } = req.body;

  const createdUser = new User({
    username,
    password,
    familyGroupId,
    email,
  });

  if (!username || !password || !familyGroupId || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foundFamilyGroup = await FamilyGroup.findOne({
    familyGroupId: familyGroupId,
  }).exec();

  if (!foundFamilyGroup) {
    return res.status(400).json({ message: "Famly Group ID does not exists." });
  }

  const duplicateEmail = await User.findOne({ email: email }).exec();

  if (duplicateEmail) {
    return res.status(401).json({ message: "Email already exists" });
  }

  const duplicateUser = foundFamilyGroup.users.includes(username);

  if (duplicateUser) {
    return res
      .status(401)
      .json({ message: "Username already exists in group!" });
  }

  foundFamilyGroup.users.push(username);
  await foundFamilyGroup.save();

  createdUser.save();

  return res.status(200).json(createdUser);
});

// @desc Update all users
// @route Patch /users
// @access Private
const updateUser = asyncHandler(async (req, res, next) => {
  const { id, username, email, password, familyGroupId } = req.body;

  if (!email || !password || !familyGroupId || !username) {
    res.status(400).json({ massage: "All fields are requred" });
  }

  const foundUserToUpdate = await User.findOne({
    email: email,
  }).exec();

  let familyGroup;

  if (foundUserToUpdate && foundUserToUpdate.familyGroupId === familyGroupId) {
    familyGroup = await FamilyGroup.findOne({
      familyGroupId: familyGroupId,
    }).exec();
    const index = familyGroup.users.findIndex((el) => el === username);
    familyGroup.users.splice(index, 1, username);
    await familyGroup.save();
  }

  foundUserToUpdate.username = username;
  foundUserToUpdate.email = email;
  foundUserToUpdate.password = password;
  foundUserToUpdate.familyGroupId = familyGroupId;

  const updatedUser = await foundUserToUpdate.save();

  res.status(200).json({
    message: `user: ${updatedUser.username} in ${familyGroup.familyGroupId} has been updated`,
  });
});

// @desc Update all users
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res, next) => {
  const { email, password, familyGroupId } = req.body;

  if (!email || !password || !familyGroupId) {
    return res
      .status(400)
      .json({ message: "Email, password and groupId are requred" });
  }

  const user = await User.findOne({ email, password, familyGroupId }).exec();
  if (!user) return res.status(400).json({ message: "No user found" });

  const familyGroup = await FamilyGroup.findOne({ familyGroupId });
  const index = familyGroup.users.indexOf(user.username);
  familyGroup.users.splice(index, 1);
  await familyGroup.save();

  const deletedUser = await user.deleteOne();
  return res.status(200).json({
    message: `user ${deletedUser.username} with family id ${deletedUser.familyGroupId} has been deleted.`,
  });
});

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser };

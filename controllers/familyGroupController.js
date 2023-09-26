const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const mongoose = require("mongoose");

const getFamilyGroup = asyncHandler(async (req, res, next) => {
  const familyGroup = await FamilyGroup.find({
    familyGroupId: req.familyGroupId,
  })
    .lean()
    .exec();
  return res.status(200).json(familyGroup);
});

const getAllFamilyGroups = asyncHandler(async (req, res, next) => {
  const allFamGroups = await FamilyGroup.find().lean().exec();
  if (!allFamGroups?.length) {
    return res.status(400).json({ message: "No family groups found" });
  }
  return res.json(allFamGroups);
});

const createNewFamilyGroup = asyncHandler(async (req, res, next) => {
  // NOT DONE YET BUT MAKE SURE THAT YOU ADD NO DUPLICATE EMAIL FOR CREATOR EMAIL
  const { familyLastName, creatorEmail, password, familyGroupId } = req.body;

  const duplicateId = await FamilyGroup.findOne({
    familyGroupId: familyGroupId,
  });

  const duplicateEmailCreator = await FamilyGroup.findOne({
    creatorEmail: creatorEmail,
  });

  // Also should check if a user already has the email aswell
  const duplicateEmail = await User.findOne({ email: creatorEmail });

  if (duplicateId) {
    return res.status(409).json({
      message: "Duplicate family group Id. Please generate a new Id.",
    });
  }

  if (duplicateEmail || duplicateEmailCreator) {
    return res.status(409).json({
      message: `${creatorEmail} already a main craetor of family group`,
    });
  }

  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const familyGroupObject = {
    familyGroupId,
    password: hashedPwd,
    creatorEmail,
    familyLastName,
  };

  const familyGroup = new FamilyGroup(familyGroupObject);
  familyGroup.save();

  if (familyGroup) {
    return res.status(201).json(familyGroup);
  } else {
    return res.status(400).json({ message: "Invalid family data recived" });
  }
});

const updateFamilyGroup = asyncHandler(async (req, res, next) => {
  const { familyGroupId, familyLastName, password, creatorEmail, id } =
    req.body;

  if (!id || !familyGroupId || !familyLastName || !creatorEmail) {
    res.status(409).json({ message: "All fields are requred" });
  }

  const familyGroup = await FamilyGroup.findById({ _id: id }).exec();

  if (!familyGroup) {
    return res.status(400).json({ message: "Family group not found" });
  }

  const duplicate = await FamilyGroup.findOne({ familyGroupId }).lean().exec();

  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: "duplicate family group id" });
  }

  familyGroup.familyGroupId = familyGroupId;
  familyGroup.familyLastName = familyLastName;
  familyGroup.creatorEmail = creatorEmail;

  if (password) familyGroup.password = await bcrypt.hash(password, 10);

  const updatedUser = await familyGroup.save();

  return res.json({
    message: `${updatedUser.familyLastName} has been updated`,
  });
});

const deleteFamilyGroup = asyncHandler(async (req, res, next) => {
  const { id, familyGroupId } = req.body;
  if (!id) {
    return res.status(400).json({ message: "familyGroup ID Required" });
  }
  const user = await User.findOne({
    familyGroup: familyGroupId,
  })
    .lean()
    .exec();

  if (user?.length) {
    return res
      .status(400)
      .json({ message: "other users other then main are still linked" });
  }

  const familyGroup = await FamilyGroup.findById({ _id: id }).exec();

  if (!familyGroup) {
    return res.status(400).json({ message: "family group not found" });
  }

  const result = await familyGroup.deleteOne();

  const reply = `Family Group ${result.familyLastName} with _id ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getFamilyGroup,
  getAllFamilyGroups,
  createNewFamilyGroup,
  updateFamilyGroup,
  deleteFamilyGroup,
};

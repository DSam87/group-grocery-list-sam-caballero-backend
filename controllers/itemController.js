const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const GroceryItem = require("../models/GroceryItem");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const getAllItems = asyncHandler(async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.status(403).json({ message: "Unauthorized" });
  }
  const refreshToken = cookies.jwt;
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({ email: decoded.email }).exec();

      if (!foundUser) return res.status(403).json({ message: "Unauthorized" });

      const foundItems = await GroceryItem.find({
        familyGroupId: foundUser.familyGroupId,
      })
        .lean()
        .exec();

      const foundItemsForUsername = await GroceryItem.find({
        familyGroupId: foundUser.familyGroupId,
      })
        .populate("user", "username")
        .lean()
        .exec();

      const returnFoundItems = foundItems.map((item, index) => {
        item.username = foundItemsForUsername[index].user.username;
        return item;
      });

      if (!returnFoundItems)
        return res.status(401).json({ message: "No Notes Found" });

      return res.status(200).json(returnFoundItems);
    })
  );
});

const postItem = asyncHandler(async (req, res, next) => {
  const { itemName, quantity } = req.body;

  if (!itemName || !quantity) {
    return res.status(400).json({ message: "All fields required." });
  }

  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(403).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({ email: decoded.email }).exec();

      const foundFamilyGroup = await FamilyGroup.findOne({
        familyGroupId: foundUser.familyGroupId,
      }).exec();

      const item = new GroceryItem({
        user: foundUser._id,
        email: foundUser.email,
        familyGroupId: foundUser.familyGroupId,
        itemName: itemName,
        quantity: quantity,
      });

      foundFamilyGroup.groceryItems.push(item._id);
      await foundFamilyGroup.save();

      const savedItem = await item.save();

      const newItem = await item.populate("user");

      return res.status(200).json({
        message: `User ${newItem.user.username} created ${newItem.itemName} item`,
      });
    })
  );
});

const updateItem = asyncHandler(async (req, res, next) => {
  const { quantity, itemName, isCompleted, id } = req.body;

  const foundItem = await GroceryItem.findById(id).exec();

  foundItem.quantity = quantity;
  foundItem.itemName = itemName;
  foundItem.completed = isCompleted;

  const savedItem = await foundItem.save();

  return res
    .status(200)
    .json({ message: `item ${savedItem.itemName} has been updated` });
});

const deleteItem = asyncHandler(async (req, res, next) => {
  const { quantity, itemName, isCompleted, id } = req.body;
  await GroceryItem.deleteOne({ _id: id });

  return res.status(200).json({ message: "Item deleted" });
});

module.exports = { getAllItems, postItem, updateItem, deleteItem };

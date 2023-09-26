const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const familySchema = new Schema({
  familyGroupId: { type: String, required: true },
  familyLastName: { type: String, required: true },
  creatorEmail: { type: String, required: true },
  password: { type: String, required: true },
  groceryItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: [],
      ref: "GroceryItem",
    },
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      default: [],
    },
  ],
});

module.exports = mongoose.model("FamilyGroup", familySchema);

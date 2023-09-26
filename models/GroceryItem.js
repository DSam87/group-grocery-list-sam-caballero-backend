const mongoose = require("mongoose");
const { Schema } = mongoose;

const groceryItemSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, required: true },
    familyGroupId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    completed: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroceryItem", groceryItemSchema);

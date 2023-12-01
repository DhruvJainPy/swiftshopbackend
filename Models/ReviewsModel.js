const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "products",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    image:[Object],
    headline: {
      type: String,
      default: null,
    },
    comment: {
      type: String,
      required: true,
      default: null,
    },
  },
  { timestamps: true }
);

const Reviews = mongoose.model("reviews", reviewSchema);
module.exports = Reviews;

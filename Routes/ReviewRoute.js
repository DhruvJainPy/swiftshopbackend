const express = require("express");
const router = express.Router();
const Product = require("../Models/ProductModel");
const Review = require("../Models/ReviewsModel");
const { isAuthenticated } = require("../Utilities/AuthenticationMiddleware");

//To fetch reviews for particular product.
router.get("/:productId/fetch", async (req, res, next) => {
  try {
    const productId = req.params["productId"];
    const reviews = await Review.find({ productId }).populate("userId");
    if (reviews.length > 0) {
      return res.status(200).json({ success: true, reviews });
    }
    return res
      .status(404)
      .json({ success: false, reviews, msg: "Reviews Not Found!" });
  } catch (error) {
    next(error);
  }
});

//To create a review for a product.
router.post("/:productId/create", isAuthenticated, async (req, res, next) => {
  try {
    const productId = req.params["productId"];
    const product = await Product.findOne({ _id: productId });
    const { rating, image, headline, comment } = req.body;
    const review = new Review({
      userId: req.user._id,
      productId,
      rating,
      image,
      headline,
      comment,
    });
    await review.save();
    const ratings = await Review.find({ productId }, { rating: 1 });
    let prod_rating = 0;
    ratings.forEach((rating) => (prod_rating += rating.rating));
    prod_rating = prod_rating / ratings.length;
    product.rating = prod_rating;
    await product.save();
    const reviews = await Review.find({ productId }).populate("userId");
    return res.status(200).json({
      success: true,
      message: "Review Created Successfully!",
      review: reviews,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//To delete an existing review.
router.post("/delete", isAuthenticated, async (req, res, next) => {
  try {
    const { id, userId } = req.body;
    const review = await Review.findOneAndDelete({ _id: id, userId });
    if (review) {
      const product = await Product.findOne({ _id: review.productId });
      const reviews = await Review.find({
        productId: review.productId,
      }).populate("userId");
      const ratings = await Review.find(
        { productId: review.productId },
        { rating: 1 }
      );
      let prod_rating = 0;
      ratings.forEach((rating) => (prod_rating += rating.rating));
      prod_rating = prod_rating / ratings.length;
      product.rating = prod_rating;
      await product.save();
      return res.status(200).json({
        success: true,
        reviews,
        message: "Review Deleted Successfully!",
      });
    }
    return res
      .status(401)
      .json({ success: false, message: "Review could not be Deleted!" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

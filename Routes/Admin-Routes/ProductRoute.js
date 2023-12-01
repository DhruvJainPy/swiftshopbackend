const express = require("express");
const router = express.Router();
const {
  isAdminLoggedIn,
  isAuthenticated,
} = require("../../Utilities/AuthenticationMiddleware");
const Product = require("../../Models/ProductModel");
const Review = require("../../Models/ReviewsModel");
const Order = require("../../Models/OrdersModel");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});

const deleteImage = async (image) => {
  const result = await cloudinary.search.expression(image).execute();
  if (result.total_count > 0) {
    const image = await cloudinary.uploader.destroy(
      result.resources[0].public_id
    );
  }
};

//To add a new product
router.post(
  "/create",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const { title, description, price, rating, category, stock, image } =
        req.body;
      const newProduct = new Product({
        title,
        description,
        price,
        rating,
        category,
        stock,
        image,
      });
      await newProduct.save();
      const products = await Product.find({});
      return res.status(200).json({ success: true, products });
    } catch (error) {
      next(error);
    }
  }
);

//To delete an existing product
router.delete(
  "/delete",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const { productId } = req.body;
      const review = await Review.deleteMany({ productId });
      const product = await Product.findOneAndDelete({ _id: productId });
      const products = await Product.find({});
      return res.status(200).json({
        success: true,
        message: "Product Successfully Deleted!",
        products,
      });
    } catch (error) {
      next(error);
    }
  }
);

//To modify an existing product
router.post(
  "/edit",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const {
        productId,
        title,
        description,
        price,
        rating,
        category,
        stock,
        image,
      } = req.body;
      if (image !== null) {
        let product = await Product.findOne({ _id: productId });
        let image1 = product.image.split("/");
        image1 = image1[image1.length - 1];
        deleteImage(image1);
        product = await Product.findOneAndUpdate(
          { _id: productId },
          { title, description, price, rating, category, stock, image }
        );
      } else {
        const  product1 = await Product.findOneAndUpdate(
          { _id: productId },
          { title, description, price, rating, category, stock }
        );
      }
      const products = await Product.find({});
      return res.status(200).json({ success: true, products });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

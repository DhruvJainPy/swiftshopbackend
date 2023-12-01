const router = require("express").Router();
const { isValidObjectId } = require("mongoose");
const Product = require("../Models/ProductModel");

router.get("/all", async (req, res, next) => {
  try {
    const data = await Product.find({});
    if (data.length > 0) {
      return res.status(200).json({ success: true, products: data });
    } else {
      return res
        .status(404)
        .json({ success: false, msg: "Products Not Found!", products: data });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/category", async (req, res, next) => {
  try {
    const categories = await Product.distinct("category");
    if (categories) {
      return res.status(200).json({ success: true, categories });
    } else {
      return res.status(404).json({ success: false, categories: [] });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/filter", async (req, res, next) => {
  try {
    const { category, filter} = req.query;
    let products = [];
    switch (filter) {
      case "price(low)":
        if (category === "null") {
          products = await Product.find().sort({ price: 1 });
        } else {
          products = await Product.find({ category }).sort({ price: 1 });
        }
        if (products.length > 0)
          return res.status(200).json({ success: true, products });
        return res.status(404).json({ success: false, products: [] });
      case "price(high)":
        if (category === "null") {
          products = await Product.find().sort({ price: -1 });
        } else {
          products = await Product.find({ category }).sort({ price: -1 });
        }
        if (products.length > 0)
          return res.status(200).json({ success: true, products });
        return res.status(404).json({ success: false, products: [] });

      case "customer":
        if (category === "null") {
          products = await Product.find().sort({ rating: -1 });
        } else {
          products = await Product.find({ category }).sort({ rating: -1 });
        }
        if (products.length > 0)
          return res.status(200).json({ success: true, products });
        return res.status(404).json({ success: false, products: [] });

      default:
        if (category === "null") {
          products = await Product.find();
        } else {
          products = await Product.find({ category });
        }
        if (products.length > 0)
          return res.status(200).json({ success: true, products });
        return res.status(404).json({ success: false, products: [] });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:category", async (req, res, next) => {
  try {
    const category = req.params["category"];
    const data = await Product.find({ category });
    if (data.length > 0) {
      return res.status(200).json({ success: true, products: data });
    } else {
      return res
        .status(404)
        .json({ success: false, msg: "Products Not Found!", products: data });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/product/:id", async (req, res, next) => {
  try {
    const productId = req.params["id"];
    if (isValidObjectId(productId)) {
      const product = await Product.findOne({ _id: productId });
      if (product) {
        return res.status(200).json({ success: true, products: [product] });
      } else {
        return res.status(404).json({
          success: false,
          msg: "Product Not Found!",
          products: [product],
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        msg: "Product Not Found!",
        products: [],
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

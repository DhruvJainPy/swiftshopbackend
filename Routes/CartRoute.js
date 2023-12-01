const router = require("express").Router();
const Cart = require("../Models/CartModel");
const { isAuthenticated } = require("../Utilities/AuthenticationMiddleware");

router.get("/get", isAuthenticated, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id,isCheckedOut:false });
    if (cart) {
      return res.status(200).json({ success: true, cart });
    } else {
      return res.status(404).json({ success: false, msg: "Cart Not Found!" });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/create", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId,isCheckedOut:false });
    const { products } = req.body;
    const { productId, quantity, price } = products;
    if (cart) {
      var finded = false;
      cart.products.map((product) => {
        if (product.productId.toString() === productId) {
          finded = true;
          return (product.quantity = quantity), (product.price = price);
        }
      });
      if (!finded) {
        cart.products.push({ productId, quantity, price });
      }
      cart.save().then((cart) => {
        return res
          .status(200)
          .json({ success: true, msg: "Cart Updated Successfully!", cart });
      });
    } else {
      const newCart = new Cart({
        userId,
        products,
      });
      await newCart.save();
      return res
        .status(200)
        .json({ success: true, msg: "Cart Successfully Created!" });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/delete", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.user._id;
    let cart = await Cart.findOne({ userId,isCheckedOut:false });
    if (!cart) {
      return res.status(404).json({ success: false, msg: "Cart Not Found!" });
    } else {
      const { productId } = req.body;
      cart.products = cart.products.filter(
        (product) => product.productId.toString() !== productId
      );
      cart.save().then((cart) => {
        return res
          .status(200)
          .json({ success: true, msg: "Cart Updated Successfully!", cart });
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

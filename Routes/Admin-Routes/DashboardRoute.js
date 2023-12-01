const express = require("express");
const router = express.Router();
const {
  isAdminLoggedIn,
  isAuthenticated,
} = require("../../Utilities/AuthenticationMiddleware");
const Product = require("../../Models/ProductModel");
const Order = require("../../Models/OrdersModel");
const user = require("../../Models/UserModel");

//To provide total count of Orders,Products and Sales Amt.
router.get(
  "/total",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const totalProducts = await Product.find({}, { distinct: true }).count();
      const totalOrders = await Order.find({}, { distinct: true }).count();
      const totalSales = await Order.aggregate([
        {
          $group: {
            _id: "$payment_status",
            totalSales: { $sum: "$total_amount" },
          },
        },
      ]);
      return res
        .status(200)
        .json({ success: true, totalProducts, totalOrders, totalSales });
    } catch (error) {
      next(error);
    }
  }
);

//To provide month-wise Sales info.
router.get(
  "/sales-month",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const data = await Order.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalAmount: { $sum: "$total_amount" },
          },
        },
      ]);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

//To provide orders details.
router.get(
  "/orders",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const ordersDetails = await Order.aggregate([
        {
          $project: {
            user: "$shipping.name",
            email: "$shipping.email",
            total: "$total_amount",
            status: "$delivery_status",
          },
        },
      ]);
      return res.status(200).json({ success: true, ordersDetails });
    } catch (error) {
      next(error);
    }
  }
);

//To provide users info.
router.get(
  "/users",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const users = await user.find({});
      if (users) {
        return res.status(200).json({ success: true, users });
      }
      return res
        .status(404)
        .json({ success: false, message: "No Users currently!" });
    } catch (error) {
      next(error);
    }
  }
);

//To change status of user.
router.put(
  "/change-status",
  isAuthenticated,
  isAdminLoggedIn,
  async (req, res, next) => {
    try {
      const { id } = req.body;
      const findUser = await user.findOne({ _id: id });
      findUser.changeStatus();
      await findUser.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "User's status updated successfully!",
        });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

const mongoose = require("mongoose");
const cron = require("node-cron");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      required: true,
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    customerId: {
      type: String,
      required: true,
    },
    payment_intent: {
      type: String,
      required: true,
    },
    delivery_date: { type: Date, required: true },
    delivery_estimate: { type: Object, required: true },
    products: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          min: 1,
          required: true,
        },
        price: {
          type: Number,
          min: 1,
          required: true,
        },
        sub_total: {
          type: Number,
          default: 0,
        },
      },
    ],
    delivery_status: {
      type: String,
      enum: ["pending", "delivered"],
      default: "pending",
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      required: true,
    },
    shipping: {
      type: Object,
      required: true,
    },
    expiresAt: {
      type: String,
      required: true,
    },
    order_date: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Orders", orderSchema);

//Schedule the task.
cron.schedule("*/5 * * * *", async () => {
  try {
    const currentDate = new Date();

    const ordersToUpdate = await Order.find({
      delivery_date: { $lt: currentDate },
    });
    for (const order of ordersToUpdate) {
      order.delivery_status = "delivered";
      await order.save();
    }
  } catch (error) {
    console.error("Error Updating Delivery Status", error);
  }
});

orderSchema.pre("save", function (next) {
  let total = (count = 0);
  this.products.map((product) => {
    product.sub_total = product.price * product.quantity;
    total += product.sub_total;
    count += product.quantity;
  });
  this.totalProducts = count;
  this.total = total;
  next();
});

module.exports = Order;

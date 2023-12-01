const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min:1
        },
        price: {
          type: Number,
          required: true,
        },
        sub_total: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalProducts: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    isCheckedOut: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

cartSchema.pre("save", function (next) {
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

const Cart = new mongoose.model("cart", cartSchema);

module.exports = Cart;

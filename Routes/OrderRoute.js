const router = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Cart = require("../Models/CartModel");
const Order = require("../Models/OrdersModel");
const Product = require("../Models/ProductModel");
const express = require("express");
const { CLIENT_URL } = process.env;
const { isAuthenticated } = require("../Utilities/AuthenticationMiddleware");
const countries = require("../Utilities/AllowedCountries");

//To monitor Stripe Events.
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    let data = request.body.data.object;
    let eventType = request.body.type;

    // Handle the event
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then(async (customer) => {
          const selectedShippingRate = await stripe.shippingRates.retrieve(
            data.shipping_cost.shipping_rate
          );

          const cart = await Cart.findOne({
            userId: customer.metadata.userId,
            isCheckedOut: false,
          });
          cart.isCheckedOut = true;
          await cart.save();
          const order = await createOrder(
            data,
            customer,
            cart,
            selectedShippingRate.delivery_estimate
          );
        })
        .catch((err) => console.log(err.message));
    }

    // Return a 200 response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

//To fetch all the orders for an user.
router.get("/fetch", isAuthenticated, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id });
    if (orders.length > 0) {
      return res.status(200).json({ success: true, orders });
    }
    return res.status(404).json({ success: false, msg: "Order Not Found!" });
  } catch (error) {
    next(error);
  }
});

//To create an Order.
router.post("/create", isAuthenticated, async (req, res, next) => {
  const { cartId, userId } = req.body;
  const cart = await Cart.findOne({ _id: cartId }).populate(
    "products.productId"
  );
  const customers = await stripe.customers.list();

  const cust = customers.data.filter(
    (customer) => customer.metadata.userId === userId
  );

  if (cust.length === 0) {
    var customer = await stripe.customers.create({
      metadata: {
        userId,
        cart: cartId,
      },
    });
  }

  const items = cart.products.map((product) => {
    return {
      price_data: {
        currency: "INR",
        product_data: {
          name: product.productId.title,
          images: [product.productId.image],
          description: product.productId.description,
          metadata: {
            id: product.productId._id,
          },
        },
        unit_amount: product.price * 100,
      },
      quantity: product.quantity,
    };
  });

  const customerId = cust.length === 0 ? customer.id : cust[0].id;

  const session = await stripe.checkout.sessions.create({
    line_items: items.map((item) => {
      return item;
    }),
    customer: customerId,
    phone_number_collection: {
      enabled: true,
    },
    shipping_address_collection: {
      allowed_countries: countries.map((country) => country.code),
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "inr",
          },
          display_name: "Free shipping",
          delivery_estimate: {
            minimum: {
              unit: "day",
              value: 3,
            },
            maximum: {
              unit: "day",
              value: 4,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 200 * 100,
            currency: "inr",
          },
          display_name: "One Day Delivery",
          delivery_estimate: {
            minimum: {
              unit: "day",
              value: 1,
            },
            maximum: {
              unit: "day",
              value: 1,
            },
          },
        },
      },
    ],
    mode: "payment",
    success_url: CLIENT_URL,
    cancel_url: `${CLIENT_URL}/cart`,
  });

  return res.status(200).json({ session });
});

const createOrder = async (data, customer, cart, delivery) => {
  cart.products.map(async (product) => {
    const newProduct = await Product.findOne({ _id: product.productId });
    newProduct.stock -= product.quantity;
    await newProduct.save();
  });

  let date1 = Date.now();
  date1 = date1 + 86400 * 1000 * delivery.maximum.value;
  date = new Date(date1);
  const newOrder = new Order({
    userId: customer.metadata.userId,
    customerId: customer.id,
    payment_intent: data.payment_intent,
    products: cart.products,
    delivery_estimate: delivery,
    delivery_date: date,
    total_amount: data.amount_total,
    payment_status: data.payment_status,
    shipping: data.customer_details,
    expiresAt: data.expires_at,
  });
  try {
    const savedOrder = await newOrder.save();
    return savedOrder;
  } catch (error) {
    return error;
  }
};

module.exports = router;

const express = require("express");
const cors = require("cors");
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const port = process.env.PORT || 5000;

//To use info from the .env files in the app.
require("dotenv").config();
const { SESSION_SECRET } = process.env;

require("./Database/Database");
const User = require("./Models/UserModel");
const Products = require("./Models/ProductModel");
const Cart = require("./Models/CartModel");
const nocache = require("nocache");
const { CLIENT_URL } = process.env;

const app = express();

require("https").globalAgent.options.rejectUnauthorized = false;
app.use(nocache());
//To parse the data in incoming requests.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//To use cookies and sessions in the App.
app.use(cookieParser(SESSION_SECRET));
app.use(
  expressSession({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      cookie: {
          sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
          secure: process.env.NODE_ENV === "production", // must be true if sameSite='none'
        }
    },
  })
);

//To Enable Request from https://swiftshop1.netlify.app/.
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    optionSuccessStatus: 200,
  })
);

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers, *, Access-Control-Allow-Origin",
    "Origin, X-Requested-with, Content_Type,Accept,Authorization",
    CLIENT_URL
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE,GET");
    return res.status(200).json({});
  }
  next();
});

//To integrate passport strategies with the Server app.
require("./Utilities/PassportConfig");
app.use(passport.initialize());
app.use(passport.session());

//To use a Router for Routes.
app.use("/user", require("./Routes/UserRoute"));
app.use("/products", require("./Routes/ProductRoute"));
app.use("/cart", require("./Routes/CartRoute"));
app.use("/orders", require("./Routes/OrderRoute"));
app.use("/reviews", require("./Routes/ReviewRoute"));
app.use("/admin/dashboard", require("./Routes/Admin-Routes/DashboardRoute"));
app.use("/admin/products", require("./Routes/Admin-Routes/ProductRoute"));

//Error Handling Middleware ,In case an Internal Server Error is encountered.
app.use((err, req, res, next) => {
  const status = 500;
  if (err.name === "InternalOAuthError") {
    return res.redirect(CLIENT_URL);
  } else {
    return res.status(500).json({ msg: "Internal Server Error!", err });
  }
});

//To start the app on specified port.
app.listen(port, () => {
  console.log(`Server started on Port ${port}!`);
});

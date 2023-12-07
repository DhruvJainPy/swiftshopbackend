const passport = require("passport");
const router = require("express").Router();
const { CLIENT_URL } = process.env;
const user = require("../Models/UserModel");
const crypto = require("crypto");

//To Import Validation Schema for body.
const { checkSchema, validationResult } = require("express-validator");
const {
  registerUserSchema,
  loginSchema,
} = require("../Utilities/ValidateSchema");

//To hash password for security.
const { hashPassword } = require("../Utilities/EncyptPassword");

//To Import Auth Middleware.
const {
  isAuthenticated,
  isLoggedIn,
} = require("../Utilities/AuthenticationMiddleware");

//To Send the Logged In User's Details.
router.get("/get", isAuthenticated, (req, res, next) => {
  // Set the headers to prevent caching
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  console.log(req);
  return res.status(200).send({ user: req.user });
});

//To Register a New User.
router.post(
  "/register",
  isLoggedIn,
  checkSchema(registerUserSchema, ["body"]),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      try {
        const { name, email, password, phone_no, gender } = req.body;
        const checkUser = await user.findOne({ email });
        if (checkUser) {
          return res
            .status(401)
            .json({ success: false, msg: "User Already Exists!" });
        }
        const hashedPassword = hashPassword(password);
        const newUser = new user({
          name,
          email,
          password: hashedPassword,
          phone_no,
          gender,
        });
        newUser.save().then((User) => {
          req.login(User, (err) => {
            if (err) {
              return res.status(500).json({ success: false, err });
            } else {
              return res.status(200).json({
                success: true,
                msg: "User Registered Successfully!",
              });
            }
          });
        });
      } catch (error) {
        next(error);
      }
    }
  }
);

//To Login an Existing User.
router.post(
  "/login",
  isLoggedIn,
  checkSchema(loginSchema, ["body"]),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, err: errors.array() });
    }
    try {
      passport.authenticate("local", (err, user) => {
        if (user) {
          req.login(user, (err) => {
            if (err) {
              return res.status(500).send(err);
            }
            return res.status(200).json({
              success: true,
              msg: "User Logged In Successfully!",
            });
          });
        } else {
          return res
            .status(400)
            .json({ success: false, msg: "Invalid Email or Password!" });
        }
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

//To Login an user with their Google Account.
router.get(
  "/google",
  isLoggedIn,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  isLoggedIn,
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "`${CLIENT_URL}/login`",
  })
);

//To Login an user with their Github Account.
router.get(
  "/github",
  isLoggedIn,
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: `${CLIENT_URL}`,
    failureRedirect: `${CLIENT_URL}/login`,
  })
);

//To Logout an Logged In User.
router.get("/logout", isAuthenticated, (req, res, next) => {
  try {
    req.logout(() => {
      req.session.destroy();
      return res
        .status(200)
        .json({ success: true, msg: "User Logged Out Successfully!" });
    });
  } catch (error) {
    next(error);
  }
});

//To change user profile.
router.put("/profile/change", isAuthenticated, async (req, res, next) => {
  try {
    const { id, fname, lname, gender } = req.body;
    const findUser = await user.findOne({ _id: id });
    if (findUser) {
      findUser.name = fname + " " + lname;
      findUser.gender = gender;
      await findUser.save();
      return res.status(200).json({
        success: true,
        message: "Profile Changed Successfully!",
        findUser,
      });
    }
    return res.status(404).json({ success: false, message: "User not found!" });
  } catch (error) {
    next(error);
  }
});

//To generate reset password url for the user.
router.post("/password/reset", async (req, res, next) => {
  try {
    const { email } = req.body;
    const user1 = await user.findOne({ email });
    if (user1) {
      const resetToken = await user1.resetTokenGenerate();
      await user1.save();
      return res.status(200).json({ success: true, link: resetToken });
      console.log(resetToken);
    } else {
      return res.status(404).json({
        success: false,
        message:
          "Email Not Found. Please ensure the email address is correct or Sign up for a new account!",
      });
    }
  } catch (error) {
    next(error);
  }
});

//To update password of user associated with token.
router.put("/password/reset", async (req, res, next) => {
  try {
    let { token } = req.body;
    const { newPassword } = req.body;
    token = await crypto.createHash("sha256").update(token).digest("hex");

    const user1 = await user.findOne({
      resetToken: token,
      resetTokenExpire: { $lt: Date.now() + 10 * 60 * 1000 },
    });
    if (user1) {
      const newHashedPassword = hashPassword(newPassword);
      user1.password = newHashedPassword;
      user1.resetToken = undefined;
      user1.resetTokenExpire = undefined;
      await user1.save();
      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully!",
      });
    } else {
      return res.status(401).json({
        success: false,
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

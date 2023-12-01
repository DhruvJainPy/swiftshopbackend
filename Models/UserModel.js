const mongoose = require("mongoose");
const crypto = require("crypto");
const cron = require("node-cron");

//To create a Schema for the Users Collection.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others", null],
      default: null,
    },
    password: {
      type: String,
      select: false,
      default: null,
    },
    phone_no: {
      type: String,
      default: null,
    },
    google_id: {
      type: String,
      default: null,
      index: {
        unique: true,
        partialFilterExpression: { google_id: { $type: "string" } },
      },
    },
    github_id: {
      type: String,
      default: null,
      index: {
        unique: true,
        partialFilterExpression: { github_id: { $type: "string" } },
      },
    },
    username: {
      type: String,
      default: null,
      index: {
        unique: true,
        partialFilterExpression: { username: { $type: "string" } },
      },
    },
    blocked: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpire: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.resetTokenGenerate = async function () {
  const resetToken = await crypto.randomBytes(20).toString("hex");

  const token = await crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetToken = token;
  this.resetTokenExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.changeStatus = async function () {
  this.blocked = this.blocked ? false : true;
  return 1;
};

const user = new mongoose.model("users", userSchema);

cron.schedule("*/1 * * * *", async () => {
  const tokensToUpdate = await user.find({
    resetTokenExpire: { $lt: Date.now() },
  });
  tokensToUpdate.map(async (token) => {
    token.resetToken = undefined;
    token.resetTokenExpire = undefined;
    await token.save();
  });
});

module.exports = user;

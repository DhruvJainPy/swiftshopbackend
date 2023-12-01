const {CLIENT_URL} = process.env;
const User = require("../Models/UserModel");

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect(CLIENT_URL);
  } else {
    next();
  }
};

const isAdminLoggedIn = async(req,res,next) => {
  const user = req.user.toObject();
  if(user.isAdmin){
    next();
  }else{
    return res.send("Not Authorized!");
  }
}

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.status(401).json({ success: false, msg: "Please Login First!" });
  }
};

module.exports.isAuthenticated = isAuthenticated;
module.exports.isLoggedIn = isLoggedIn;
module.exports.isAdminLoggedIn = isAdminLoggedIn;

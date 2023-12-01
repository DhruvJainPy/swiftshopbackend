const bcrypt = require("bcrypt");

//To hash the provided password using SHA256 algorithm.
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

module.exports.hashPassword = hashPassword;

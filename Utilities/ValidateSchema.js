//To validate registration info in incoming requests.
const registerUserSchema = {
  name: {
    notEmpty: true,
    errorMessage: "Please Enter a Name!",
  },
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: "Please Enter a Valid Email!",
  },
  password: {
    notEmpty: {
      errorMessage: "Password cannot be empty!",
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
      },
      errorMessage:
        "Password must be greater than 6 and contain at least one uppercase letter, one lowercase letter, and one digit",
    },
  },
  phone_no: {
    isMobilePhone: {
      options: ["any", { strictMode: true }],
      errorMessage: "Please Enter A Valid Phone Number!",
    },
  },
  gender: {
    matches: {
      options: [/\b(?:Male|Female|Others)\b/],
      errorMessage: "Invalid Value for Gender",
    },
  },
};

//To validate login info in incoming requests.
const loginSchema = {
  email: {
    isEmail: true,
    errorMessage: "Please Enter a Valid Email!",
    normalizeEmail: true,
  },
  password: {
    notEmpty: {
      errorMessage: "Password cannot be empty!",
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
      },
      errorMessage:
        "Password must be greater than 6 and contain at least one uppercase letter, one lowercase letter, and one digit",
    },
  },
};

module.exports.registerUserSchema = registerUserSchema;
module.exports.loginSchema = loginSchema;

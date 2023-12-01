const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} = process.env;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GithubStrategy = require("passport-github2").Strategy;

//To use Passport Local Strategy to Authenticate user.
const strategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  (username, password, done) => {
    try {
      User.findOne({ email: username })
        .select("+password")
        .then(async (user) => {
          if (user !== null) {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          } else {
            return done(null, false);
          }
        });
    } catch (error) {
      return done(error, false);
    }
  }
);

passport.use(strategy);

//To use Passport Google Auth20 Strategy to Authenticate user.
const googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/user/google/callback",
  },
  async (refreshToken, accessToken, profile, done) => {
    const user = await User.findOneAndUpdate(
      { email: profile.emails[0].value, google_id: null },
      { google_id: profile.id }
    );
    if (user) {
      return done(null, user);
    } else {
      const findUser = await User.findOne({ google_id: profile.id });
      if (findUser !== null) {
        done(null, findUser);
      } else {
        const newUser = new User({
          email: profile.emails[0].value,
          name: profile.displayName,
          google_id: profile.id,
          password: null,
          github_id: null,
          username: null,
        });
        newUser.save().then((user) => done(null, user));
      }
    }
  }
);
passport.use(googleStrategy);

//To use Passport Github Auth Strategy to Authenticate user.
const githubStrategy = new GithubStrategy(
  {
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "/user/github/callback",
    scope: "user:email",
  },
  async (accessToken, refreshToken, profile, done) => {
    const user = await User.findOneAndUpdate(
      { email: profile.emails[0].value, github_id: null },
      { github_id: profile.id }
    );
    if (user) {
      return done(null, user);
    } else {
      const findUser = await User.findOne({ github_id: profile.id });
      if (findUser !== null) {
        done(null, findUser);
      } else {
        const newUser = new User({
          email: profile.emails[0].value,
          name: profile._json.name,
          google_id: null,
          password: null,
          github_id: profile.id,
          username: null,
        });
        newUser.save().then((user) => done(null, user));
      }
    }
  }
);

passport.use(githubStrategy);

//To Serialize a User.
passport.serializeUser((user, done) => {
  return done(null, user._id);
});

//To Deserialize a User.
passport.deserializeUser((id, done) => {
  User.findOne({ _id: id })
    .then((user) => {
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch((err) => {
      return done(err, false);
    });
});

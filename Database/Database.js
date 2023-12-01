const mongoose = require("mongoose");
const { URI } = process.env;

//To Connect the server to the Database.
async function connectDatabase() {
  try {
    mongoose
      .connect(URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      })
      .then(() => {
        console.log("Connected to Database!");
      });
  } catch (err) {
    console.log(err);
    setTimeout(connectDatabase, 5000)
  }
}

connectDatabase();

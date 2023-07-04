const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });
const app = require("./app");

const database = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
).replace("<DATABASE_NAME>", process.env.DATABASE_NAME);

mongoose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => console.log("DB Connection successful!"));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App listening on port ${port}...`);
});

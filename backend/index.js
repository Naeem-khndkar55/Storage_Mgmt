const app = require("./src/app");
const PORT = process.env.PORT || 5001;
require("dotenv").config();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

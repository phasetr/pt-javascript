const express = require("express");
const app = express();
const authRouter = require("./routers/auth");
const cors = require("cors");

require("dotenv").config();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);

app.listen(PORT, () => console.log(`server is running on port ${PORT}`))

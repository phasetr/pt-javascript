const express = require("express");
const app = express();
const authRouter = require("./routers/auth");
const postsRouter = require("./routers/posts");
const usersRouter = require("./routers/users");
const cors = require("cors");

require("dotenv").config();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);

app.listen(PORT, () => console.log(`server is running on port ${PORT}`))

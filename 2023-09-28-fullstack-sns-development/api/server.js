import express from "express";

const app = express();

const PORT = 8000;

app.get("/", (req, res) => {
  console.log("Hello World!");
  res.send("<h1>Hello World!</h1>");
});
app.listen(PORT, () => console.log(`server is running on port ${PORT}`))

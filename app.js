const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { sequelize } = require("./models");

const webSocket = require("./socket");
const indexRouter = require("./routes");
const authRouter = require("./routes/auth");
const workspaceRouter = require("./routes/workspace");

const passportConfig = require("./passport");
const { isLoggedIn } = require("./middlewares/auth");

const app = express();
sequelize.sync();
passportConfig(passport);
const sessionMiddleware = session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  saveUninitialized: true,
});

// Middlewares
app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// app.use(express.static(path.join(__dirname, "public")));
// app.use("/img", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/user", authRouter);
app.use("/workspace", isLoggedIn, workspaceRouter);

app.use("/:code", isLoggedIn, (req, res, next) => {
  req.code = req.params.code;
  indexRouter(req, res, next);
});

// 404
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error
app.use((err, req, res) => {
  res.status(err.status || 500).send("SERVER ERROR!");
});

const server = app.listen(4000, () => {
  console.log("server listen on 4000");
});

webSocket(server, app, sessionMiddleware);

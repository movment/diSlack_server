const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

const { Workspace, User } = require("../../models");

const router = express.Router();

// router.use("/profile", express.static(path.join(__dirname, "uploads")));

// /:code/user/list
router.get("/list", async (req, res, next) => {
  const { code } = req;
  try {
    const workspace = await Workspace.findOne({ where: { code } });
    const users = await workspace.getUsers();
    const result = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// /:code/user/profile/:id
router.get("/profile/:id", async (req, res, next) => {
  const { id } = req.params;
  const { code } = req;
  try {
    const workspace = await Workspace.findOne({ where: { code } });
    const users = await workspace.getUsers();

    const [result] = users.filter(user => parseInt(id, 10) === user.id);
    res.json({ id: result.id, name: result.name, email: result.email });
  } catch (err) {
    next(err);
  }
});

fs.readdir("uploads", err => {
  if (err) {
    console.log("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
    fs.mkdirSync("uploads");
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 10MB => 파일용량 바이트 단위
});

// 이미지 업로드를 처리하는 라우터
// /:code/user/profile
router.post("/profile", upload.single("profile_img"), (req, res) => {
  console.log(req.file);
  res.json({ url: `/profile/${req.file.filename}` });
});

const upload2 = multer();

router.post("/", upload2.none(), async (req, res, next) => {
  try {
    const user = await User.update({
      where: { id: req.user.id },
      profile_img: req.body.url,
    });
    res
      .status(201)
      .json({
        id: req.user.id,
        name: req.user.name,
        profile_img: req.body.url,
      });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

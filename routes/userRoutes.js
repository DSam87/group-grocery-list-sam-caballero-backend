const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// const verifyJWT = require("../middleware/verifyJWT");
// router.use(verifyJWT);

router
  .route("/")
  .post(userController.createNewUser)
  .get(userController.getAllUsers)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

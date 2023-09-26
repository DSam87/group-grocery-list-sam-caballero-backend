const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const familyGroupController = require("../controllers/familyGroupController");

const verifyJWT = require("../middleware/verifyJWT");
router.use(verifyJWT);

router
  .route("/")
  .get(familyGroupController.getFamilyGroup)
  .post(familyGroupController.createNewFamilyGroup)
  .patch(familyGroupController.updateFamilyGroup)
  .delete(familyGroupController.deleteFamilyGroup);

module.exports = router;

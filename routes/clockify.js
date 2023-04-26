let router = require("express").Router();
let clockifyController = require("../controllers/clockify");

router.get("/", clockifyController.setActivities);

module.exports = router;

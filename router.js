var express = require('express');
var app = express();
var router = express.Router();
var landingpage = require("./controllers/landingpage")
var checkout = require("./controllers/checkout");
var checkin = require("./controllers/checkin");
var payfines = require("./controllers/payfines");
var createborrower = require("./controllers/createborrower");
var updatefines = require("./controllers/updatefines");
var changedate = require("./controllers/changedate")

router.get("/",landingpage);

router.get("/checkout", checkout.search);
router.post("/checkout",checkout.index);
router.get("/checkout/:isbn",checkout.show);
router.post("/checkout/:isbn",checkout.borrow);

router.get("/checkin", checkin.search);
router.post("/checkin", checkin.index);
router.get("/checkin/:loan_id", checkin.return);

router.get("/payfines", payfines.search);
router.post("/payfines", payfines.index);
router.get("/payfines/:card_id", payfines.pay);

router.get("/createborrower", createborrower.new );
router.post("/createborrower", createborrower.create);

router.get("/updatefines",updatefines.update);

router.post("/changedate", changedate.update);

module.exports = router;
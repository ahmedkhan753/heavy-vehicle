/**
 * Meta Routes  → mounted at /api/meta
 */

const express = require("express");
const { getFilters } = require("../controllers/meta.controller");
const { getGuide, getEstimate } = require("../controllers/priceGuide.controller");

const router = express.Router();

router.get("/filters", getFilters);
router.get("/price-guide", getGuide);
router.get("/price-guide/estimate", getEstimate);

module.exports = router;

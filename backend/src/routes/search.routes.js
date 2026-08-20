/**
 * Search Routes  → mounted at /api/search
 */

const express = require("express");
const { search } = require("../controllers/search.controller");

const router = express.Router();

router.get("/", search); // public

module.exports = router;

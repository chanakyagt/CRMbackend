const express = require('express');
const router = express.Router();
const { getWorksForStore ,addWork} = require('../controllers/storeController.js');
const { getImages } = require('../controllers/adminController');
const path = require('path');
const fs = require('fs');
// Route to get works for a specific store by name
router.get('/works/:name', getWorksForStore);
router.post('/works/add', addWork);
const IMAGES_DIR = path.join(__dirname, '../public/images');

router.get('/works/:workCode/images', getImages);

module.exports = router;

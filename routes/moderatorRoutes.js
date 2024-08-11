const express = require('express');
const router = express.Router();
const { moderatorControllerFunction } = require('../controllers/moderatorController.js');
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Adjust the path as necessary
const Store = require('../models/store'); // Ensure this import is added
const Work = require('../models/work');
const Overview = require('../models/overview'); 

const path = require('path');
const fs = require('fs');
// Define your moderator-specific routes here

const { getWorks, editWork, removeWork, getModeratorStores,addWorks,getTechnicians,getImages } = require('../controllers/adminController');

// Moderator routes for works
router.get('/works', getWorks);
router.get('/works', getWorks);

router.put('/works/:id/edit', editWork);
router.delete('/works/:id/remove', removeWork);

router.get('/technicians',getTechnicians);
// Moderator route for fetching stores
router.get('/stores', getModeratorStores);
// Assuming the path to your images folder
const IMAGES_DIR = path.join(__dirname, '../public/images');

router.get('/works/:workCode/images', getImages);

module.exports = router;

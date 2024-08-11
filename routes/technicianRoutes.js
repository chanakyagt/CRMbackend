const express = require('express');
const router = express.Router();
const {getWorksForTechnician } = require('../controllers/technicianController'); // Adjust the path as necessary
const { editWork,getImages} = require('../controllers/adminController');


// Route to get works for a specific technician by ID
router.get('/works/:id', getWorksForTechnician);
router.put('/works/:id/edit', editWork);
router.get('/works/:workCode/images', getImages);

module.exports = router;

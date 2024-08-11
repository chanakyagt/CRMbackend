const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const {
  getEmployees,
  addEmployee,
  editEmployee,
  removeEmployee,
  addStore,
  editStore,
  removeStore,
  getStores,
  getWorks,
  addWork,
  editWork,
  getTechnicians,
  removeWork,
  getImages,
  getOverallAnalysis // Import the getOverallAnalysis controller function
} = require('../controllers/adminController');

// Employee routes
router.get('/employees', getEmployees);
router.post('/employees/add', addEmployee);
router.put('/employees/:ID/edit', editEmployee);
router.delete('/employees/remove/:ID', removeEmployee);

// Store routes
router.post('/stores/add', addStore);
router.put('/stores/:ID/edit', editStore);
router.delete('/stores/remove/:ID', removeStore);
router.get('/stores', getStores);
router.get('/technicians', getTechnicians);

// Work routes (nested under admin)
router.get('/works', getWorks);
router.post('/works/add', addWork);
router.put('/works/:id/edit', editWork);
router.delete('/works/:id/remove', removeWork);

// Image retrieval route
router.get('/works/:workCode/images', getImages);

// Overall Analysis route
router.get('/overall-analysis', getOverallAnalysis);

module.exports = router;

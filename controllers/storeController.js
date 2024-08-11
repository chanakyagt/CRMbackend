const bcrypt = require('bcrypt');
const User = require('../models/user'); // Adjust the path as necessary
const Store = require('../models/store'); // Ensure this import is added
const Work = require('../models/work');
const Overview = require('../models/overview'); // Add this line
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Controller function to get works for a specific store by name
const getWorksForStore = async (req, res) => {
  try {
    // Retrieve the store name from the URL parameters
    const storeName = req.params.name;

    // Check if store name is provided
    if (!storeName) {
      return res.status(400).json({ message: 'Store name is required' });
    }

    // Query the database to find works associated with the specific store and populate the technician's Name
    const works = await Work.find({ store: storeName }).populate('technician', 'Name');

    // Check if any works were found
    if (!works.length) {
      return res.status(404).json({ message: 'No works found for this store' });
    }

    // Send the retrieved works as the response
    res.json(works);
  } catch (error) {
    console.error('Error fetching works for store:', error);
    res.status(500).json({ message: 'Failed to fetch works for store' });
  }
};


module.exports = {
  getWorksForStore,
};

// Function to generate a new code for a given category
const generateCode = async (category, codeSeries) => {
  const overview = await Overview.findOne({ category });
  let newCode;

  if (overview) {
    overview.latestEntry += 1;
    overview.numberOfEntries += 1;
    newCode = `${codeSeries}${overview.latestEntry}`;
    await overview.save();
  } else {
    newCode = `${codeSeries}1`;
    const newOverview = new Overview({
      category,
      codeSeries,
      numberOfEntries: 1,
      latestEntry: 1
    });
    await newOverview.save();
  }

  return newCode;
};

const upload = multer({
  dest: 'uploads/', // Temporary storage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit per file
});

const addWork = [
  upload.array('images'), // Middleware to handle file uploads
  async (req, res) => {
    try {
      const {
        store,
        date,
        equipmentModel,
        serviceVisitType,
        issueAboutEquipment,
        customerName,
        customerAddress,
        customerPhoneNumber,
        serviceUpdates,
        amountPaidBy,
        amountUpdates,
      } = req.body;

      // Validate required fields
      if (!store || !date || !equipmentModel || !customerName || !customerPhoneNumber) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      // Find the store by name and populate the defaultTechnician field
      const storeDoc = await Store.findOne({ Name: store }).populate('defaultTechnician');
      if (!storeDoc) {
        return res.status(404).json({ message: 'Store not found' });
      }

      // Extract the technician ID from the populated defaultTechnician field
      const technicianID = storeDoc.defaultTechnician ? storeDoc.defaultTechnician._id : undefined;

      // Generate new work code
      const workCode = await generateCode('services', 7000);

      // Create a directory for the job code if it doesn't exist
      const dir = path.join(__dirname, `../public/images/${workCode}`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Process and save each image
      const imagePaths = [];
      if (req.files) {
        await Promise.all(req.files.map(async (file) => {
          const filePath = path.join(dir, file.originalname);
          try {
            await sharp(file.path)
              .resize(800) // Resize image
              .toFile(filePath);

            // Save relative path for front-end access
            imagePaths.push(`/images/${workCode}/${file.originalname}`);
          } catch (err) {
            console.error('Error processing image:', err);
          } finally {
            // Ensure the file is removed regardless of processing success
            try {
              fs.unlinkSync(file.path); // Remove original file
            } catch (unlinkErr) {
              console.error(`Failed to remove file: ${file.path}`, unlinkErr);
            }
          }
        }));
      }

      // Create new work with default status 'submitted'
      const newWork = new Work({
        workCode,
        store: storeDoc.Name,
        date,
        equipmentModel,
        serviceVisitType,
        issueAboutEquipment,
        customerName,
        customerAddress,
        customerPhoneNumber,
        serviceUpdates,
        technician: technicianID,
        status: 'submitted',
        amountPaidBy,
        amountUpdates,
        images: imagePaths, // Include the image paths
      });

      await newWork.save();

      res.status(201).json({ message: 'Work added successfully', workCode });
    } catch (error) {
      console.error('Error adding work:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

// Export controller functions
module.exports = {
  getWorksForStore,
  addWork, // Export addWork as a named export
};

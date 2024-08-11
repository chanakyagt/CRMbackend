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

// Function to get all employees (admins, moderators, and technicians)
exports.getEmployees = async (req, res) => {
  try {
    const roles = ['admin', 'moderator', 'technician'];
    const employees = await User.find({ Type: { $in: roles } });
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'An error occurred while fetching employees' });
  }
};

// Function to remove an employee by ID
exports.removeEmployee = async (req, res) => {
  try {
    const { ID } = req.params;
    const employee = await User.findOneAndDelete({ ID });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json({ message: 'Employee removed successfully' });
  } catch (error) {
    console.error('Error removing employee:', error);
    res.status(500).json({ error: 'An error occurred while removing the employee' });
  }
};

// Function to edit an employee by ID
exports.editEmployee = async (req, res) => {
  try {
    const { ID } = req.params;
    const { Name, Type, Location, Password } = req.body;

    // Validate required fields
    if (!Name || !Type || !Location || !Password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Hash the new password if it is provided
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const updatedEmployee = await User.findOneAndUpdate(
      { ID },
      { Name, Type, Location, Password: hashedPassword },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee updated successfully', employee: updatedEmployee });
  } catch (error) {
    console.error('Error editing employee:', error);
    res.status(500).json({ error: 'An error occurred while editing the employee' });
  }
};

// Function to add a new employee
exports.addEmployee = async (req, res) => {
  try {
    const { Name, Type, Location, Password } = req.body;

    // Validate required fields
    if (!Name || !Type || !Location || !Password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Generate new employee ID
    const ID = await generateCode('employees', 3000);

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // Create new employee
    const newEmployee = new User({ ID, Name, Type, Location, Password: hashedPassword });
    await newEmployee.save();

    res.status(201).json({ status: 'ok', message: 'Employee added successfully', ID });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to add a new store
exports.addStore = async (req, res) => {
  try {
    const { Name, Location, Password, defaultTechnician } = req.body;

    // Validate required fields
    if (!Name || !Location || !Password || !defaultTechnician) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Generate new store ID
    const ID = await generateCode('stores', 5000);

    // Check if technician exists
    const technician = await User.findOne({ _id: defaultTechnician, Type: 'technician' });
    if (!technician) {
      return res.status(400).json({ message: 'Default technician does not exist' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // Create new store
    const newStore = new Store({ ID, Name, Location, Password: hashedPassword, defaultTechnician });
    await newStore.save();

    // Create corresponding user
    const newUser = new User({ ID, Name, Location, Password: hashedPassword, Type: 'store' });
    await newUser.save();

    return res.status(201).json({ status: 'ok', message: 'Store added successfully', ID });
  } catch (error) {
    console.error('Error adding store:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to edit a store by ID
exports.editStore = async (req, res) => {
  try {
    const { ID } = req.params;
    const { Name, Location, Password, defaultTechnician } = req.body;

    // Validate required fields
    if (!Name || !Location || !Password || !defaultTechnician) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if technician exists
    const technician = await User.findOne({ _id: defaultTechnician, Type: 'technician' });
    if (!technician) {
      return res.status(400).json({ message: 'Default technician does not exist' });
    }

    // Hash the new password if it is provided
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const updatedStore = await Store.findOneAndUpdate(
      { ID },
      { Name, Location, Password: hashedPassword, defaultTechnician },
      { new: true }
    );

    if (!updatedStore) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { ID, Type: 'store' },
      { Name, Location, Password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Corresponding user not found' });
    }

    res.status(200).json({ message: 'Store updated successfully' });
  } catch (error) {
    console.error('Error editing store:', error);
    res.status(500).json({ error: 'An error occurred while editing the store' });
  }
};

// Function to remove a store by ID
exports.removeStore = async (req, res) => {
  try {
    const { ID } = req.params;
    const store = await Store.findOneAndDelete({ ID });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const user = await User.findOneAndDelete({ ID, Type: 'store' });
    if (!user) {
      return res.status(404).json({ message: 'Corresponding user not found' });
    }

    res.status(200).json({ message: 'Store removed successfully' });
  } catch (error) {
    console.error('Error removing store:', error);
    res.status(500).json({ error: 'An error occurred while removing the store' });
  }
};

// Function to get all stores
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('defaultTechnician', 'Name'); // Populate the defaultTechnician field with the Name field
    res.status(200).json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'An error occurred while fetching stores' });
  }
};

// Controller function to get all technicians
exports.getTechnicians = async (req, res) => {
  try {
    // Query the User model for users with the type "technician"
    const technicians = await User.find({ Type: 'technician' });

    // Check if any technicians were found
    if (!technicians.length) {
      return res.status(404).json({ message: 'No technicians found' });
    }

    // Send the retrieved technicians as the response
    res.status(200).json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ message: 'Failed to fetch technicians' });
  }
};

// Function to get all works
exports.getWorks = async (req, res) => {
  try {
    // Find all works and populate the technician field with the Name field from the User model
    let works = await Work.find().populate({
      path: 'technician',
      model: 'User', // Specify the model if it's not automatically inferred
      select: 'Name' // Select the Name field from the User model
    });

    // Process each work to include image paths
    works = await Promise.all(works.map(async (work) => {
      const workCode = work.workCode;
      const dir = path.join(__dirname, `../public/images/${workCode}`);
      let imagePaths = [];

      if (fs.existsSync(dir)) {
        imagePaths = fs.readdirSync(dir).map(file => `/images/${workCode}/${file}`);
      }

      return { ...work._doc, images: imagePaths };
    }));

    res.status(200).json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ error: 'An error occurred while fetching works' });
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/', // Temporary storage
  
});

exports.addWork = [
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

// Function to edit a work by ID
// Function to edit a work by ID
exports.editWork = [
  upload.array('images'), // Middleware to handle file uploads
  async (req, res) => {
    try {
      const { id } = req.params;
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
        status,
        technician,
        amountPaidBy,
        amountUpdates
      } = req.body;

      console.log('Received update request:', req.body); // Log the received data
      console.log('Received files:', req.files); // Log the received files

      // Validate required fields
      if (!store || !date || !equipmentModel || !customerName || !customerPhoneNumber || !status || !technician) {
        console.error('Validation failed - required fields missing');
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      // Verify the technician exists and is of type 'technician'
      const tech = await User.findById(technician);
      if (!tech || tech.Type !== 'technician') {
        console.error('Invalid technician ID:', technician);
        return res.status(400).json({ message: 'Invalid technician ID' });
      }

      // Define the directory path for images
      const dir = path.join(__dirname, `../public/images/${id}`);
      if (!fs.existsSync(dir)) {
        console.log(`Directory ${dir} does not exist. Creating...`);
        fs.mkdirSync(dir, { recursive: true }); // Create directory if it doesn't exist
      } else {
        console.log(`Directory ${dir} exists.`);
      }

      // Process and save each image
      const imagePaths = [];
      if (req.files && req.files.length > 0) {
        console.log('Processing images...');
        await Promise.all(req.files.map(async (file) => {
          const filePath = path.join(dir, file.originalname);
          try {
            await sharp(file.path)
              .resize(800) // Resize image
              .toFile(filePath);

            console.log(`Image processed and saved: ${filePath}`);
            // Save relative path for front-end access
            imagePaths.push(`/images/${id}/${file.originalname}`);
          } catch (err) {
            console.error('Error processing image:', err);
          } finally {
            // Ensure the file is removed regardless of processing success
            try {
              fs.unlinkSync(file.path); // Remove original file
              console.log(`Original file removed: ${file.path}`);
            } catch (unlinkErr) {
              console.error(`Failed to remove file: ${file.path}`, unlinkErr);
            }
          }
        }));
      } else {
        console.log('No images uploaded or available for processing.');
      }

      console.log('Image paths to be added:', imagePaths);

      // Update the work document
      const updatedWork = await Work.findOneAndUpdate(
        { workCode: id },
        {
          store,
          date,
          equipmentModel,
          serviceVisitType,
          issueAboutEquipment,
          customerName,
          customerAddress,
          customerPhoneNumber,
          serviceUpdates,
          status,
          technician,
          amountPaidBy,
          amountUpdates,
          ...(imagePaths.length > 0 && { $push: { images: { $each: imagePaths } } }) // Add new images to existing array only if there are new images
        },
        { new: true }
      );

      if (!updatedWork) {
        console.error('Work not found with workCode:', id);
        return res.status(404).json({ message: 'Work not found' });
      }

      console.log('Work updated successfully:', updatedWork);

      res.status(200).json({ message: 'Work updated successfully', work: updatedWork });
    } catch (error) {
      console.error('Error editing work:', error);
      res.status(500).json({ error: 'An error occurred while editing the work' });
    }
  }
];

 

// Function to remove a work by workCode
exports.removeWork = async (req, res) => {
  try {
    const { id } = req.params;

    const work = await Work.findOneAndDelete({ workCode: id });
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    const dir = path.join(__dirname, `../public/images/${id}`);
    if (fs.existsSync(dir)) {
      fs.rmdirSync(dir, { recursive: true });
    }

    res.status(200).json({ message: 'Work removed successfully' });
  } catch (error) {
    console.error('Error removing work:', error);
    res.status(500).json({ error: 'An error occurred while removing the work' });
  }
};
// Function to get all stores for moderators
exports.getModeratorStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    console.error('Error fetching stores for moderators:', error);
    res.status(500).json({ error: 'An error occurred while fetching stores for moderators' });
  }
};

// Function to get images for a specific work code
const IMAGES_DIR = path.join(__dirname, '../public/images');

exports.getImages = (req, res) => {
  const { workCode } = req.params;
  const workImagesPath = path.join(IMAGES_DIR, workCode);

  fs.readdir(workImagesPath, (err, files) => {
    if (err) {
      console.error(`Error reading images for work code ${workCode}:`, err);
      return res.status(404).json({ message: 'Images not found' });
    }

    const imagePromises = files.map(file => {
      const filePath = path.join(workImagesPath, file);
      return fs.promises.readFile(filePath, { encoding: 'base64' })
        .then(base64 => ({ fileName: file, base64: `data:image/jpeg;base64,${base64}` }))
        .catch(error => {
          console.error(`Error reading image file ${file}:`, error);
          return null;
        });
    });

    Promise.all(imagePromises)
      .then(images => {
        res.status(200).json({ images: images.filter(img => img !== null) });
      })
      .catch(error => {
        console.error('Error processing images:', error);
        res.status(500).json({ message: 'Error processing images' });
      });
  });
};



exports.getOverallAnalysis = async (req, res) => {
  try {
    const overview = await Overview.find({});
    const stores = await Store.countDocuments();
    const users = await User.aggregate([
      { $group: { _id: "$Type", count: { $sum: 1 } } }
    ]);
    const works = await Work.countDocuments();

    // Fetching the count of jobs by status
    const jobStatusCounts = await Work.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.json({ overview, stores, users, works, jobStatusCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
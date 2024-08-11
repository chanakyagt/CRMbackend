const Work = require('../models/work');
const User = require('../models/user');

const getWorksForTechnician = async (req, res) => {
  try { console.log("entered the getWorksForTechnician contrroller")
    const technicianId = req.params.id; // This is the ID field in the User model

    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    // Find the user with the given ID field
    const user = await User.findOne({ ID: technicianId });

    if (!user) {
      return res.status(404).json({ message: 'No technician found with this ID' });
    }

    // Use the user's ObjectId to find the works
    const works = await Work.find({ technician: user._id }).populate('technician', 'Name');

    if (!works.length) {
      return res.status(404).json({ message: 'No works found for this technician' });
    }

    res.json(works);
  } catch (error) {
    console.error('Error fetching works for technician:', error);
    res.status(500).json({ message: 'Failed to fetch works for technician' });
  }
};

module.exports = {
  getWorksForTechnician,
  // other exports
};

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Adjust the path as necessary

// Function to register a new user
const registerUser = async (req, res) => {
  try {
    const { ID, Name, Type, Location, Password } = req.body;

    // Validate required fields
    if (!ID || !Name || !Type || !Location || !Password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ ID });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this ID already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // Create new user
    const newUser = new User({ ID, Name, Type, Location, Password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to login a user
// loginUser function
const loginUser = async (req, res) => {
  try {
    const { ID, Password } = req.body;

    // Validate required fields
    if (!ID || !Password) {
      return res.status(400).json({ error: 'ID and Password are required' });
    }

    // Find user by ID
    const user = await User.findOne({ ID });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Password' });
    }

    // Create and sign JWT token
    const payload = {
      user: {
        id: user._id,
        type: user.Type,
        ID: user.ID, // Include ID in the payload
        name: user.Name // Include Name in the payload
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' });

    // Set the token in a cookie
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });

    // Include name in the response
    res.status(200).json({
      status: 'ok',
      data: token,
      userType: user.Type,
      ID: user.ID,
      name: user.Name
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Function to logout a user
const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, loginUser, logoutUser };

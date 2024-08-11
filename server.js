const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bodyParser = require('body-parser');
const { registerUser, loginUser, logoutUser } = require('./controllers/userController'); // Adjust the path as necessary
const connectToDatabase = require('./config/usersdbconnect');
const auth = require('./middleware/auth');

const adminRoutes = require('./routes/adminRoutes');
const moderatorRoutes = require('./routes/moderatorRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const storeRoutes = require('./routes/storeRoutes');

app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from this origin
  credentials: true, // Allow cookies to be sent
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

connectToDatabase();

app.get('/', function (req, res) {
  res.send("Welcome");
});

app.post('/register', registerUser);
app.post('/login', loginUser);
app.post('/logout', logoutUser);

app.use('/admin', auth(['admin']), adminRoutes);
app.use('/moderator', auth(['moderator']), moderatorRoutes);
app.use('/technician', auth(['technician']), technicianRoutes);
app.use('/store', auth(['store']), storeRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

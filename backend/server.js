const express = require('express');
const sequelize = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const { DataTypes, Op } = require('sequelize');

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
const WEATHER_API_KEY = process.env.WEATHER_API || 'b5ffae52e505c0f76e99c7516339ca5b';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running' });
});

// MySQL Database Connection
const sequelizeInstance = new sequelize('companion_app', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  logging: console.log,
});

// Test database connection
async function testConnection() {
  try {
    await sequelizeInstance.authenticate();
    console.log('Connection to MySQL established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message, error.stack);
    process.exit(1);
  }
}

// Define Models
const User = sequelizeInstance.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
});

const Journal = sequelizeInstance.define('Journal', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  archived: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
});

const Goal = sequelizeInstance.define('Goal', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  archived: { type: DataTypes.BOOLEAN, defaultValue: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
});

const SleepRecord = sequelizeInstance.define('SleepRecord', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATE, allowNull: false },
  sleepTime: { type: DataTypes.STRING, allowNull: false },
  awakeTime: { type: DataTypes.STRING, allowNull: false },
  duration: { type: DataTypes.FLOAT, allowNull: false },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
});

const WaterIntake = sequelizeInstance.define('WaterIntake', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATE, allowNull: false },
  glasses: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
});

const BMIHistory = sequelizeInstance.define('BMIHistory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATE, allowNull: false },
  height: { type: DataTypes.FLOAT, allowNull: false },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  bmi: { type: DataTypes.FLOAT, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
});

const Mood = sequelizeInstance.define('Mood', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATE, allowNull: false },
  mood: {
    type: DataTypes.ENUM('Awful', 'Bad', 'Normal', 'Good', 'Amazing'),
    allowNull: false
  },
  subMood: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
});

const RecommendedVideo = sequelizeInstance.define('RecommendedVideo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  videoId: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  thumbnail: { type: DataTypes.STRING, allowNull: false },
  mood: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
});

// Define Associations
User.hasMany(Journal, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Journal.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Goal, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(SleepRecord, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
SleepRecord.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(WaterIntake, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
WaterIntake.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(BMIHistory, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
BMIHistory.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Mood, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Mood.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RecommendedVideo, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
RecommendedVideo.belongsTo(User, { foreignKey: 'userId' });

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied: No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      console.log('Register: Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (password.length < 6) {
      console.log('Register: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      console.log('Register: Username already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    console.log('User registered:', user.id, username);
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (error) {
    console.error('Register error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      console.log('Login: Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('Login: User not found:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('Login: Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Login successful:', username, 'Token issued');
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Journal Routes
app.get('/api/journals', authenticateToken, async (req, res) => {
  try {
    const journals = await Journal.findAll({ where: { userId: req.user.id, archived: req.query.archived === 'true' } });
    res.json(journals);
  } catch (error) {
    console.error('Get journals error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

app.post('/api/journals', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      console.log('Post journal: Missing title or content');
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const journal = await Journal.create({
      title,
      content,
      date: new Date(),
      archived: false,
      userId: req.user.id,
    });
    res.status(201).json(journal);
  } catch (error) {
    console.error('Post journal error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create journal' });
  }
});

app.put('/api/journals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, archived } = req.body;
    const journal = await Journal.findOne({ where: { id, userId: req.user.id } });
    if (!journal) {
      console.log('Update journal: Journal not found:', id);
      return res.status(404).json({ error: 'Journal not found' });
    }
    await journal.update({ title, content, date: new Date(), archived });
    res.json(journal);
  } catch (error) {
    console.error('Update journal error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update journal' });
  }
});

app.delete('/api/journals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await Journal.findOne({ where: { id, userId: req.user.id } });
    if (!journal) {
      console.log('Delete journal: Journal not found:', id);
      return res.status(404).json({ error: 'Journal not found' });
    }
    await journal.destroy();
    res.json({ message: 'Journal deleted' });
  } catch (error) {
    console.error('Delete journal error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete journal' });
  }
});

// Goal Routes
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.findAll({ where: { userId: req.user.id, archived: req.query.archived === 'true' } });
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      console.log('Post goal: Missing title or description');
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const goal = await Goal.create({
      title,
      description,
      date: new Date(),
      archived: false,
      completed: false,
      userId: req.user.id,
    });
    res.status(201).json(goal);
  } catch (error) {
    console.error('Post goal error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, archived, completed } = req.body;
    const goal = await Goal.findOne({ where: { id, userId: req.user.id } });
    if (!goal) {
      console.log('Update goal: Goal not found:', id);
      return res.status(404).json({ error: 'Goal not found' });
    }
    await goal.update({ title, description, date: new Date(), archived, completed });
    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({ where: { id, userId: req.user.id } });
    if (!goal) {
      console.log('Delete goal: Goal not found:', id);
      return res.status(404).json({ error: 'Goal not found' });
    }
    await goal.destroy();
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Sleep Record Routes
app.get('/api/sleep-records', authenticateToken, async (req, res) => {
  try {
    const sleepRecords = await SleepRecord.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
    });
    res.json(sleepRecords);
  } catch (error) {
    console.error('Get sleep records error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch sleep records' });
  }
});

app.post('/api/sleep-records', authenticateToken, async (req, res) => {
  try {
    const { sleepTime, awakeTime } = req.body;
    if (!sleepTime || !awakeTime) {
      console.log('Post sleep record: Missing sleep or awake time');
      return res.status(400).json({ error: 'Sleep and awake times are required' });
    }

    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    const [awakeHours, awakeMinutes] = awakeTime.split(':').map(Number);
    let sleepDate = new Date(2025, 4, 27, sleepHours, sleepMinutes);
    let awakeDate = new Date(2025, 4, 27, awakeHours, awakeMinutes);
    if (awakeDate <= sleepDate) awakeDate.setDate(awakeDate.getDate() + 1);
    const duration = (awakeDate - sleepDate) / (1000 * 60 * 60);

    const sleepRecord = await SleepRecord.create({
      date: new Date(),
      sleepTime,
      awakeTime,
      duration,
      userId: req.user.id,
    });
    res.status(201).json(sleepRecord);
  } catch (error) {
    console.error('Post sleep record error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create sleep record' });
  }
});

app.put('/api/sleep-records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sleepTime, awakeTime } = req.body;
    const sleepRecord = await SleepRecord.findOne({ where: { id, userId: req.user.id } });
    if (!sleepRecord) {
      console.log('Update sleep record: Record not found:', id);
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    const [awakeHours, awakeMinutes] = awakeTime.split(':').map(Number);
    let sleepDate = new Date(2025, 4, 27, sleepHours, sleepMinutes);
    let awakeDate = new Date(2025, 4, 27, awakeHours, awakeMinutes);
    if (awakeDate <= sleepDate) awakeDate.setDate(awakeDate.getDate() + 1);
    const duration = (awakeDate - sleepDate) / (1000 * 60 * 60);

    await sleepRecord.update({ sleepTime, awakeTime, duration, date: new Date() });
    res.json(sleepRecord);
  } catch (error) {
    console.error('Update sleep record error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update sleep record' });
  }
});

// Water Intake Routes
app.get('/api/water-intake', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const waterIntake = await WaterIntake.findOne({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: today },
      },
    });
    res.json(waterIntake || { glasses: 0 });
  } catch (error) {
    console.error('Get water intake error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch water intake' });
  }
});

app.post('/api/water-intake', authenticateToken, async (req, res) => {
  try {
    const { glasses } = req.body;
    if (!Number.isInteger(glasses) || glasses < 0) {
      console.log('Post water intake: Invalid glasses value:', glasses);
      return res.status(400).json({ error: 'Valid number of glasses required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let waterIntake = await WaterIntake.findOne({
      where: {
        userId: req.user.id,
        date: { [Op.gte]: today },
      },
    });

    if (waterIntake) {
      waterIntake.glasses += glasses;
      if (waterIntake.glasses > 20) waterIntake.glasses = 20;
      await waterIntake.save();
    } else {
      waterIntake = await WaterIntake.create({
        date: new Date(),
        glasses: Math.min(glasses, 20),
        userId: req.user.id,
      });
    }
    res.status(201).json(waterIntake);
  } catch (error) {
    console.error('Post water intake error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update water intake' });
  }
});

// BMI History Routes
app.post('/api/bmi-history', authenticateToken, async (req, res) => {
  try {
    const { height, weight, bmi, category } = req.body;
    if (!height || !weight || !bmi || !category) {
      console.log('Post BMI: Missing required fields');
      return res.status(400).json({ error: 'Height, weight, BMI, and category are required' });
    }
    const bmiRecord = await BMIHistory.create({
      date: new Date(),
      height,
      weight,
      bmi,
      category,
      userId: req.user.id,
    });
    res.status(201).json(bmiRecord);
  } catch (error) {
    console.error('Post BMI error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to save BMI record' });
  }
});

// Mood Routes
app.post('/api/moods', authenticateToken, async (req, res) => {
  try {
    const { mood, subMood } = req.body;
    if (!mood || !subMood) {
      console.log('Post mood: Missing mood or subMood');
      return res.status(400).json({ error: 'Mood and subMood are required' });
    }
    const validMoods = ['Awful', 'Bad', 'Normal', 'Good', 'Amazing'];
    if (!validMoods.includes(mood)) {
      console.log('Post mood: Invalid mood value:', mood);
      return res.status(400).json({ error: 'Invalid mood value' });
    }
    const moodEntry = await Mood.create({
      date: new Date(),
      mood,
      subMood,
      userId: req.user.id,
    });
    console.log('Mood saved for user:', req.user.id, mood, subMood);
    res.status(201).json(moodEntry);
  } catch (error) {
    console.error('Post mood error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to save mood: ' + error.message });
  }
});

app.get('/api/moods', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.latest === 'true' ? 1 : undefined;
    const moods = await Mood.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
      limit,
    });
    res.json(moods);
  } catch (error) {
    console.error('Get moods error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

// Recommended Video Routes
app.get('/api/recommended-videos', authenticateToken, async (req, res) => {
  try {
    const latestMood = await Mood.findOne({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
    });
    const mood = latestMood ? latestMood.mood : 'mindfulness';
    const videos = await RecommendedVideo.findAll({
      where: { userId: req.user.id, mood },
      limit: 8,
    });
    res.json(videos);
  } catch (error) {
    console.error('Get recommended videos error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch recommended videos' });
  }
});

app.post('/api/recommended-videos', authenticateToken, async (req, res) => {
  try {
    const { videos, mood } = req.body;
    if (!videos || !Array.isArray(videos) || !mood) {
      console.log('Post recommended videos: Missing or invalid videos/mood');
      return res.status(400).json({ error: 'Videos array and mood are required' });
    }

    // Clear existing videos for this mood and user
    await RecommendedVideo.destroy({
      where: { userId: req.user.id, mood },
    });

    // Save new videos
    const savedVideos = await Promise.all(
      videos.map(video =>
        RecommendedVideo.create({
          videoId: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          mood,
          userId: req.user.id,
        })
      )
    );

    console.log('Recommended videos saved for user:', req.user.id, mood);
    res.status(201).json(savedVideos);
  } catch (error) {
    console.error('Post recommended videos error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to save recommended videos' });
  }
});

// Weather Route
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      console.log('Get weather: Missing lat or lon');
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const response = await axios.get('http://api.weatherstack.com/current', {
      params: {
        access_key: WEATHER_API_KEY,
        query: `${lat},${lon}`,
        units: 'm' // Metric units (Celsius)
      }
    });

    const { current } = response.data;
    if (!current) {
      console.log('Get weather: Invalid WeatherStack response');
      return res.status(500).json({ error: 'Invalid weather data' });
    }

    res.json({
      description: current.weather_descriptions[0] || 'Unknown',
      temperature: Math.round(current.temperature)
    });
  } catch (error) {
    console.error('Get weather error:', error.message, error.stack);
    const errorMessage = error.response?.data?.error?.info || 'Error fetching weather data';
    res.status(500).json({ error: errorMessage });
  }
});

// Initialize Database and Start Server
(async () => {
  try {
    await testConnection();
    await sequelizeInstance.sync({ alter: true }); // Update schema if needed
    console.log('Database synced successfully.');
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error.message, error.stack);
    process.exit(1);
  }
})();
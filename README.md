# Companion App

A web-based personal wellness application designed to help users track their mood, sleep, goals, journal entries, and mindfulness activities. The app features a user-friendly interface with a blue and white theme, dynamic visualizations, and a MySQL backend for persistent data storage. It leverages data from a mood-tracking CSV (`Daylio_Abid.csv`) to provide insights into mood and activity trends.

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
  - [Importing CSV Data](#importing-csv-data)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Authentication**: Login and sign-up functionality with MySQL-backed user management.
- **Dashboard**: Displays current date, water intake with a progress ring, BMI calculator, and placeholder weather data.
- **Goals**: Create, edit, archive, and delete goals, with a view for archived goals.
- **Journal**: Write, edit, archive, and delete journal entries, with a view for archived journals.
- **Sleep Tracking**: Log sleep and wake times, calculate duration, and visualize sleep data with a Chart.js bar chart.
- **Mood Tracking**: Take a quiz to assess mood (energy, positivity, stress, motivation, connection) and view mood trends from imported CSV data.
- **Mindfulness**: Access mood-based mindfulness and podcast recommendations (e.g., for Sad, Happy, Anxious, Depressed moods).
- **Insights**: Visualize mood and activity trends using Chart.js (e.g., mood frequency bar chart).
- **Responsive Design**: Styled with CSS for a consistent blue and white theme across devices.

## Technologies
- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6)
  - Chart.js for data visualizations
- **Backend**:
  - Node.js with Express.js
  - MySQL for database management
- **Other**:
  - localStorage (frontend-only version)
  - dotenv for environment variables
  - CORS for cross-origin requests
- **Data**:
  - `Daylio_Abid.csv`: Historical mood and activity data (2018–2021)

## Project Structure
```
companion-app/
├── backend/
│   ├── server.js              # Express server and API endpoints
│   ├── .env                 # Environment variables
│   └── package.json         # Backend dependencies
├── frontend/
│   ├── css/
│   │   └── styles.css       # Global styles (blue/white theme, progress ring, modals)
│   ├── js/
│   │   ├── auth.js          # Authentication (login/signup)
│   │   ├── dashboard.js     # Dashboard logic (water intake, BMI, date)
│   │   ├── goals.js         # Goal CRUD operations
│   │   ├── journal.js       # Journal CRUD operations
│   │   ├── sleep.js         # Sleep tracking and chart
│   │   ├── header.js        # Navigation menu logic
│   │   └── insights.js      # Mood/activity visualizations
│   ├── index.html           # Login page
│   ├── dashboard.html       # Main dashboard
│   ├── goals.html           # Goals management
│   ├── journal.html         # Journal management
│   ├── sleep.html           # Sleep tracking
│   ├── insights.html        # Mood/activity insights
│   ├── quiz.html            # Mood quiz
│   └── mindfulness.html     # Mindfulness recommendations
├── Daylio_Abid.csv          # Mood and activity dataset
└── README.md                # Project documentation
```

## Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8 or higher)
- **Web Browser** (Chrome, Firefox, etc.)
- **Git** (optional, for cloning the repository)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder:
   ```plaintext
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=companion_app
   PORT=3000
   ```
   Replace `your_mysql_username` and `your_mysql_password` with your MySQL credentials.
4. Start the backend server:
   ```bash
   node index.js
   ```
   The server runs on `http://localhost:3000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Serve the frontend using a local server (e.g., with `npx serve`):
   ```bash
   npx serve
   ```
   Access the app at `http://localhost:5000` (or the port provided by the server).

### Database Setup
1. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```
2. Create the database:
   ```sql
   CREATE DATABASE companion_app;
   USE companion_app;
   ```
3. Create tables (see [Database Schema](#database-schema) below or run the SQL commands provided there).

### Importing CSV Data
1. Clean `Daylio_Abid.csv` to ensure consistent formatting (e.g., standardize dates, remove special characters).
2. Import into MySQL using phpMyAdmin or the CLI:
   ```sql
   LOAD DATA INFILE '/path/to/Daylio_Abid.csv'
   INTO TABLE moods
   FIELDS TERMINATED BY ',' 
   ENCLOSED BY '"'
   LINES TERMINATED BY '\n'
   IGNORE 1 ROWS
   (full_date, @date, @weekday, time, sub_mood, @activities, mood)
   SET created_at = STR_TO_DATE(@date, '%Y-%m-%d'),
       user_id = 1;
   ```
3. For activities, preprocess the CSV to split comma-separated activities or use SQL:
   ```sql
   INSERT INTO activities (user_id, activity_name, created_at)
   SELECT 1, TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(activities, ',', n.digit), ',', -1)), STR_TO_DATE(date, '%Y-%m-%d')
   FROM temp_daylio,
        (SELECT 1 AS digit UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) n
   WHERE n.digit <= LENGTH(activities) - LENGTH(REPLACE(activities, ',', '')) + 1;
   ```
   Adjust `user_id` based on actual users.

## Database Schema
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    goal_text TEXT NOT NULL,
    created_at DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE journals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    journal_text TEXT NOT NULL,
    created_at DATE NOT NULL,
    archived BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE sleep_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    sleep_time TIME NOT NULL,
    wake_time TIME NOT NULL,
    duration FLOAT NOT NULL,
    created_at DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE quiz_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    energy INT,
    positivity INT,
    stress INT,
    motivation INT,
    connection INT,
    mood VARCHAR(50),
    created_at DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_name VARCHAR(100) NOT NULL,
    created_at DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE moods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    mood VARCHAR(50) NOT NULL,
    sub_mood VARCHAR(50),
    created_at DATE NOT NULL,
    time TIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints
| Method | Endpoint                | Description                       | Request Body Example                                  |
|--------|-------------------------|-----------------------------------|------------------------------------------------------|
| POST   | `/api/login`            | Authenticate user                | `{ "username": "user", "password": "pass" }`         |
| POST   | `/api/signup`           | Register new user                | `{ "username": "user", "password": "pass", "email": "user@example.com" }` |
| GET    | `/api/goals/:userId`    | Fetch user goals                 | -                                                    |
| POST   | `/api/goals`            | Create a goal                    | `{ "userId": 1, "goalText": "Run 5km", "createdAt": "2025-06-20" }` |
| PUT    | `/api/goals/:id`        | Update a goal                    | `{ "goalText": "Run 10km", "completed": true, "archived": false }` |
| DELETE | `/api/goals/:id`        | Delete a goal                    | -                                                    |
| POST   | `/api/sleep`            | Log sleep record                 | `{ "userId": 1, "sleepTime": "22:00", "wakeTime": "06:00", "duration": 8, "createdAt": "2025-06-20" }` |
| GET    | `/api/sleep/:userId`    | Fetch sleep records              | -                                                    |
| GET    | `/api/moods/:userId`    | Fetch mood records               | -                                                    |
| GET    | `/api/activities/:userId` | Fetch activity records         | -                                                    |

*Note*: Similar endpoints exist for journals and quiz responses (not fully implemented in frontend).

## Usage
1. **Login/Sign-up**: Access the app via `index.html`, create an account, or log in.
2. **Dashboard**: View water intake, BMI, and navigate to other features.
3. **Goals & Journals**: Add, edit, archive, or delete entries.
4. **Sleep Tracking**: Log sleep/wake times and view a weekly chart.
5. **Mood Quiz**: Answer five questions to assess mood and get mindfulness recommendations.
6. **Insights**: View mood and activity trends (e.g., mood frequency chart).
7. **Mindfulness**: Explore mood-based content (videos, podcasts).

## Screenshots
*(Add screenshots here, e.g., dashboard, goals page, mood chart. Use a tool like Lightshot to capture and host images.)*
- Dashboard: [Insert link]
- Mood Chart: [Insert link]

## Future Improvements
- Implement quiz submission logic in `quiz.js` to store responses in `quiz_responses` table.
- Add real-time weather API integration in `dashboard.js`.
- Enhance authentication with bcrypt for password hashing and JWT for sessions.
- Integrate machine learning (e.g., scikit-learn) for mood prediction based on quiz and CSV data.
- Deploy to cloud (e.g., AWS RDS for MySQL, Heroku for backend).
- Add Recharts for advanced visualizations in `insights.html`.

## Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit changes: `git commit -m "Add feature"`.
4. Push to branch: `git push origin feature-name`.
5. Open a pull request.

## License
MIT License. See [LICENSE](LICENSE) for details.

---
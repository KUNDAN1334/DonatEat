require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: [
      'http://localhost:3000',
      'https://donat-eat.vercel.app',
      'https://donat-eat-git-main-kundans-projects-0aacc48c.vercel.app',
      'https://donat-kz8rlp4qe-kundans-projects-0aacc48c.vercel.app'
    ],
    credentials: true
  }));
  
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/ngos', require('./routes/ngos'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.send('DonatEat API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType, name, phone, uid } = req.body;
    
    // Log incoming request for debugging
    console.log('Registration request:', { email, name, userType, uid });
    
    // Validate required fields
    if (!uid || !email || !name || !userType) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: uid, email, name, userType' });
    }

    // User is already created in firebase-auth by frontend, just save additional info in Firestore
    const userDoc = {
      uid,
      email,
      name,
      phone: phone || '',
      userType, // 'donor' or 'ngo'
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    await db.collection('users').doc(uid).set(userDoc);
    
    console.log('User registered successfully:', uid);
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      uid,
      userType
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/:uid', async (req, res) => {
  try {
    console.log('Fetching profile for:', req.params.uid);
    
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    
    if (!userDoc.exists) {
      console.log('User not found:', req.params.uid);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Profile found:', req.params.uid);
    res.json(userDoc.data());
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

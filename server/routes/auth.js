const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType, name, phone, uid } = req.body;
    // User is already created in firebase-auth by frontend, just save additional info in Firestore
    const userDoc = {
      uid,
      email,
      name,
      phone,
      userType, // 'donor' or 'ngo'
      createdAt: new Date().toISOString()
    };
    await db.collection('users').doc(uid).set(userDoc);
    res.status(201).json({ message: 'User registered successfully', uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(userDoc.data());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../config/firebase');
const { analyzeFoodImage } = require('../services/geminiService');
const { geohashForLocation } = require('geofire-common');
const { geminiQuotaMiddleware } = require('../middlewares/geminiQuota');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Analyze food image with Gemini
router.post('/analyze-food',geminiQuotaMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    const imageBase64 = req.file.buffer.toString('base64');
    const analysis = await analyzeFoodImage(imageBase64);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create donation
router.post('/create', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    // Upload image to Firebase Storage
    const file = bucket.file(`food_donations/${Date.now()}_${req.file.originalname}`);
    await file.save(req.file.buffer, { contentType: req.file.mimetype });
    await file.makePublic();
    const imageUrl = file.publicUrl();

    // Include imageUrl with donation data
    const donation = {
      donorId: req.body.donorId,
      foodDetails: req.body.foodAnalysis,
      preparationTime: req.body.preparationTime,
      expiryTime: req.body.expiryTime,
      quantity: req.body.quantity,
      location: req.body.location,
      imageUrl,
      additionalNotes: req.body.additionalNotes,
      status: 'available',
      createdAt: new Date().toISOString(),
      matchedNGO: null,
      deliveryDetails: null
    };

    const docRef = await db.collection('donations').add(donation);
    res.status(201).json({ success: true, donationId: docRef.id, donation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available donations
router.get('/available', async (req, res) => {
  try {
    const snapshot = await db.collection('donations')
      .where('status', '==', 'available')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const donations = [];
    snapshot.forEach(doc => donations.push({ id: doc.id, ...doc.data() }));
    res.json({ donations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get donor's donations
router.get('/donor/:donorId', async (req, res) => {
  try {
    const snapshot = await db.collection('donations')
      .where('donorId', '==', req.params.donorId)
      .orderBy('createdAt', 'desc')
      .get();
    const donations = [];
    snapshot.forEach(doc => donations.push({ id: doc.id, ...doc.data() }));
    res.json({ donations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Donor approves/rejects delivery
router.put('/:donationId/delivery-approval', async (req, res) => {
  try {
    const { approved, donorId } = req.body;
    const donationRef = db.collection('donations').doc(req.params.donationId);
    const donationDoc = await donationRef.get();
    if (!donationDoc.exists) return res.status(404).json({ error: 'Donation not found' });
    const donation = donationDoc.data();
    if (donation.donorId !== donorId) return res.status(403).json({ error: 'Unauthorized' });
    await donationRef.update({
      deliveryApproved: approved,
      deliveryApprovedAt: new Date().toISOString(),
      status: approved ? 'approved_for_delivery' : 'matched'
    });
    if (approved) {
      const porterBooking = await bookPorterDelivery(donation);
      await donationRef.update({
        deliveryDetails: porterBooking,
        status: 'in_transit'
      });
    }
    res.json({ success: true, message: approved ? 'Delivery approved and booked!' : 'Delivery declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function bookPorterDelivery(donation) {
  return {
    bookingId: `PORTER${Date.now()}`,
    trackingUrl: `https://porter.in/track/${Date.now()}`,
    estimatedTime: '45 minutes',
    driverName: 'Mock Driver',
    driverPhone: '+91-XXXXXXXXXX',
    vehicleNumber: 'MH01AB1234',
    status: 'assigned',
    bookedAt: new Date().toISOString()
  };
}

module.exports = router;

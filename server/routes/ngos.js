const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { distanceBetween, geohashQueryBounds } = require('geofire-common');

// Get nearby donations for NGO
router.post('/nearby-donations', async (req, res) => {
  try {
    const { ngoLocation, radiusKm, foodPreferences } = req.body;
    const center = [ngoLocation.latitude, ngoLocation.longitude];
    const radiusInM = radiusKm * 1000;
    const bounds = geohashQueryBounds(center, radiusInM);
    const promises = bounds.map(b =>
      db.collection('donations')
        .where('status', '==', 'available')
        .orderBy('location.geohash')
        .startAt(b[0]).endAt(b[1]).get()
    );
    const snapshots = await Promise.all(promises);
    let results = [];
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const data = doc.data();
        const donationLoc = [data.location.latitude, data.location.longitude];
        const distanceInKm = distanceBetween(center, donationLoc);
        if (distanceInKm <= radiusKm) {
          if (foodPreferences && foodPreferences.length) {
            if (foodPreferences.includes(data.foodDetails.foodType)) {
              results.push({ id: doc.id, ...data, distance: distanceInKm.toFixed(2) });
            }
          } else {
            results.push({ id: doc.id, ...data, distance: distanceInKm.toFixed(2) });
          }
        }
      }
    }
    results.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
    res.json({ donations: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept donation
router.post('/accept-donation', async (req, res) => {
  try {
    const { donationId, ngoId, deliveryRequired } = req.body;
    await db.collection('donations').doc(donationId).update({
      status: 'matched',
      matchedNGO: ngoId,
      matchedAt: new Date().toISOString(),
      deliveryRequired
    });
    await db.collection('notifications').add({
      userId: (await db.collection('donations').doc(donationId).get()).data().donorId,
      type: 'donation_accepted',
      message: 'Your donation has been accepted by an NGO',
      donationId,
      createdAt: new Date().toISOString(),
      read: false
    });
    res.json({ success: true, message: 'Donation accepted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const notifications = [];
    snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    await db.collection('notifications')
      .doc(req.params.notificationId)
      .update({ read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/:userId/unread-count', async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.params.userId)
      .where('read', '==', false)
      .get();
    res.json({ count: snapshot.size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

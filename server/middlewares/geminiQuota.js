const { db, FieldValue } = require('../config/firebase');

const MAX_GEMINI_REQUESTS_PER_MONTH = 15000;

async function canUseGeminiAPI() {
  const usageDocRef = db.collection('apiUsage').doc('gemini');
  const usageDoc = await usageDocRef.get();

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (!usageDoc.exists) {
    await usageDocRef.set({ count: 0, resetDate: nextMonth.toISOString() });
    return true;
  }

  const data = usageDoc.data();

  if (new Date(data.resetDate) <= now) {
    await usageDocRef.set({ count: 0, resetDate: nextMonth.toISOString() });
    return true;
  }

  return data.count < MAX_GEMINI_REQUESTS_PER_MONTH;
}

async function incrementGeminiUsage() {
  const usageDocRef = db.collection('apiUsage').doc('gemini');
  await usageDocRef.update({ count: FieldValue.increment(1) });
}

async function geminiQuotaMiddleware(req, res, next) {
  if (await canUseGeminiAPI()) {
    await incrementGeminiUsage();
    next();
  } else {
    res.status(429).json({ error: 'Gemini API monthly limit reached' });
  }
}

module.exports = { geminiQuotaMiddleware };

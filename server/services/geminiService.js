const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeFoodImage(imageBase64) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    const prompt = `Analyze this food image and provide JSON with: 
{
  "foodName": "name",
  "foodType": "veg or non-veg",
  "category": "main course/dessert/snacks",
  "estimatedServings": number,
  "cuisineType": "Indian/Chinese/etc.",
  "ingredients": ["list of main ingredients"],
  "freshnessScore":1-10,
  "storageRecommendation":"refrigerate/consume immediately/room temperature",
  "shelfLife":"hours"
}`;
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    };
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Invalid AI JSON response');
  } catch (error) {
    console.error(error);
    throw new Error('Gemini API error: ' + error.message);
  }
}

module.exports = { analyzeFoodImage };

import React, { useState, useEffect } from 'react';
import { auth, storage } from '../../firebase'; // Make sure you export storage from your firebase config
import api from '../../services/api';
import {
  Container, Box, Typography, Button, TextField, Card, CardContent, CardMedia, CircularProgress, Grid, Chip
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

function CreateDonation() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [foodAnalysis, setFoodAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    preparationTime: '',
    expiryTime: '',
    quantity: '',
    location: { address: '', latitude: 0, longitude: 0 },
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(d => ({
          ...d,
          location: {
            ...d.location,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }
        })),
        (err) => console.error('Location error:', err)
      );
    }
  }, []);

  const handleImageSelect = e => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setFoodAnalysis(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('image', selectedImage);
      const res = await api.post('/api/donations/analyze-food', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFoodAnalysis(res.data.analysis);
    } catch (error) {
      if (error.response?.status === 429) {
        alert('Your free quota for Gemini AI analysis is reached for this month. Please try again later.');
      } else {
        alert('Failed to analyze image: ' + error.message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!foodAnalysis) {
      alert('Please analyze the food image first');
      return;
    }
    if (!selectedImage) {
      alert('Please select an image.');
      return;
    }

    setSubmitting(true);
    try {
      // Upload image to Firebase Storage before submitting form
      const storageRef = storage.ref();
      const imageRef = storageRef.child(`food_donations/${Date.now()}_${selectedImage.name}`);
      await imageRef.put(selectedImage);
      const imageUrl = await imageRef.getDownloadURL();

      // Submit donation with imageUrl from firebase storage
      await api.post('/api/donations/create', {
        donorId: auth.currentUser.uid,
        foodAnalysis,
        ...formData,
        imageUrl
      });

      alert('Donation posted successfully!');
      setSelectedImage(null);
      setImagePreview(null);
      setFoodAnalysis(null);
      setFormData({
        preparationTime: '',
        expiryTime: '',
        quantity: '',
        location: formData.location,
        additionalNotes: ''
      });
    } catch (error) {
      alert('Failed to create donation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Create Food Donation</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Step 1: Upload Food Image</Typography>
          <Button variant="contained" component="label" startIcon={<PhotoCamera />} sx={{ mb: 2 }}>
            Select Image
            <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
          </Button>
          {imagePreview && (
            <>
              <CardMedia component="img" height="300" image={imagePreview} alt="Food preview" sx={{ objectFit: 'contain', mb: 2 }} />
              <Button
                variant="contained"
                onClick={handleAnalyzeImage}
                disabled={analyzing || foodAnalysis}
                fullWidth
              >
                {analyzing ? <CircularProgress size={24} /> : 'Analyze Food with AI'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {foodAnalysis && (
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>AI Analysis Results</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Food Name:</strong> {foodAnalysis.foodName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Chip label={foodAnalysis.foodType} color={foodAnalysis.foodType === 'veg' ? 'success' : 'error'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Category:</strong> {foodAnalysis.category}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography><strong>Servings:</strong> {foodAnalysis.estimatedServings} people</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Storage:</strong> {foodAnalysis.storageRecommendation}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Shelf Life:</strong> {foodAnalysis.shelfLife}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {foodAnalysis && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Step 2: Additional Details</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                type="datetime-local"
                label="Preparation Time"
                InputLabelProps={{ shrink: true }}
                fullWidth
                margin="normal"
                required
                value={formData.preparationTime}
                onChange={e => setFormData(d => ({ ...d, preparationTime: e.target.value }))}
              />
              <TextField
                type="datetime-local"
                label="Best Before (Expiry Time)"
                InputLabelProps={{ shrink: true }}
                fullWidth
                margin="normal"
                required
                value={formData.expiryTime}
                onChange={e => setFormData(d => ({ ...d, expiryTime: e.target.value }))}
              />
              <TextField
                label="Pickup Address"
                multiline
                rows={2}
                fullWidth
                margin="normal"
                required
                value={formData.location.address}
                onChange={e => setFormData(d => ({
                  ...d,
                  location: { ...d.location, address: e.target.value }
                }))}
              />
              <TextField
                label="Additional Notes"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                value={formData.additionalNotes}
                onChange={e => setFormData(d => ({ ...d, additionalNotes: e.target.value }))}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Donation'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default CreateDonation;

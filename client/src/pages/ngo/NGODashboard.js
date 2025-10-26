import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import api from '../../services/api';
import {
  Container, Box, Typography, Card, CardContent, CardMedia, Grid, Button, Chip, TextField, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { LocationOn, Restaurant, AccessTime } from '@mui/icons-material';

function NGODashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ radiusKm: 10, foodPreferences: [] });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (err) => console.error(err)
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation) fetchNearbyDonations();
  }, [userLocation, filters]);

  const fetchNearbyDonations = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ngos/nearby-donations', {
        ngoLocation: userLocation,
        radiusKm: filters.radiusKm,
        foodPreferences: filters.foodPreferences
      });
      setDonations(res.data.donations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDonation = async (deliveryRequired) => {
    try {
      await api.post('/ngos/accept-donation', {
        donationId: selectedDonation.id,
        ngoId: auth.currentUser.uid,
        deliveryRequired
      });
      alert('Donation accepted successfully!');
      setConfirmDialog(false);
      fetchNearbyDonations();
    } catch (error) {
      alert('Failed to accept donation: ' + error.message);
    }
  };

  const getUrgencyColor = (expiryTime) => {
    const hoursLeft = (new Date(expiryTime) - new Date()) / 36e5;
    if (hoursLeft < 2) return 'error';
    if (hoursLeft < 6) return 'warning';
    return 'success';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Available Food Donations Nearby</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Search Radius (km)"
                type="number"
                fullWidth
                value={filters.radiusKm}
                onChange={e => setFilters({ ...filters, radiusKm: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Food Preference</InputLabel>
                <Select
                  multiple
                  value={filters.foodPreferences}
                  label="Food Preference"
                  onChange={e => setFilters({ ...filters, foodPreferences: e.target.value })}
                >
                  <MenuItem value="veg">Vegetarian</MenuItem>
                  <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? <Typography>Loading donations...</Typography> : (
        <Grid container spacing={3}>
          {donations.length > 0 ? donations.map(donation => (
            <Grid item xs={12} md={6} key={donation.id}>
              <Card>
                <CardMedia component="img" height="200" image={donation.imageUrl} alt={donation.foodDetails.foodName} />
                <CardContent>
                  <Typography variant="h6">{donation.foodDetails.foodName}</Typography>
                  <Chip label={donation.foodDetails.foodType} color={donation.foodDetails.foodType === 'veg' ? 'success' : 'error'} size="small" sx={{ mb: 1 }} />
                  <Typography>Serves: {donation.foodDetails.estimatedServings} people</Typography>
                  <Typography>Distance: {donation.distance} km</Typography>
                  <Chip label={`Expires: ${new Date(donation.expiryTime).toLocaleString()}`} color={getUrgencyColor(donation.expiryTime)} size="small" sx={{ mt: 1, mb: 2 }} />
                  <Typography color="text.secondary" sx={{ mb: 2 }}>{donation.additionalNotes}</Typography>
                  <Button variant="contained" fullWidth onClick={() => { setSelectedDonation(donation); setConfirmDialog(true); }}>Accept Donation</Button>
                </CardContent>
              </Card>
            </Grid>
          )) : <Typography align="center" color="text.secondary">No donations available in your area</Typography>}
        </Grid>
      )}

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Accept Donation</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>How would you like to receive this donation?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={() => { handleAcceptDonation(false); }} variant="outlined">We'll Pick Up</Button>
          <Button onClick={() => { handleAcceptDonation(true); }} variant="contained">Request Delivery</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default NGODashboard;

import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import api from '../../services/api';
import Footer from '../../components/Footer';
import {
  Container, Box, Typography, Card, CardContent, CardMedia, Grid, Button, Chip, TextField, FormControl, InputLabel,
  Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar
} from '@mui/material';
import { LocationOn, Restaurant, AccessTime } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function NGODashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ radiusKm: 10, foodPreferences: [] });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const navigate = useNavigate();

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
    // eslint-disable-next-line
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
    <Box sx={{display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    bgcolor: '#f4f7fa',
    overflow: 'hidden', }}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            DonatEat - NGO 
          </Typography>
          <Button color="secondary" variant="outlined" sx={{ ml: 2 }} onClick={() => navigate('/logout')}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ flexGrow: 1, mt: 4, mb: 4, overflow: 'auto'}}>
        <Typography variant="h4" gutterBottom>Available Food Donations Nearby</Typography>
        <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Search Radius (km)"
                  type="number"
                  fullWidth
                  sx={{ bgcolor: "#fff" }}
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
                    sx={{ bgcolor: "#fff" }}
                  >
                    <MenuItem value="veg">Vegetarian</MenuItem>
                    <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {loading ? <Typography sx={{ my: 4 }}>Loading donations...</Typography> : (
          <Grid container spacing={3}>
            {donations.length > 0 ? donations.map(donation => (
              <Grid item xs={12} md={6} key={donation.id}>
                <Card elevation={3} sx={{ borderRadius: 2, bgcolor: "#fff" }}>
                  <CardMedia component="img" height="200" image={donation.imageUrl} alt={donation.foodDetails.foodName} sx={{ objectFit: "cover", borderRadius: 2 }} />
                  <CardContent>
                    <Typography variant="h6">{donation.foodDetails.foodName}</Typography>
                    <Chip
                      label={donation.foodDetails.foodType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                      color={donation.foodDetails.foodType === 'veg' ? 'success' : 'error'}
                      size="small"
                      icon={<Restaurant />}
                      sx={{ mb: 1, fontWeight: 500 }}
                    />
                    <Typography>Serves: {donation.foodDetails.estimatedServings} people</Typography>
                    <Typography>Distance: {donation.distance} km</Typography>
                    <Chip
                      label={`Expires: ${new Date(donation.expiryTime).toLocaleString()}`}
                      color={getUrgencyColor(donation.expiryTime)}
                      size="small"
                      icon={<AccessTime />}
                      sx={{ mt: 1, mb: 2 }}
                    />
                    <Typography color="text.secondary" sx={{ mb: 2 }}>{donation.additionalNotes}</Typography>
                    <Button variant="contained" fullWidth onClick={() => { setSelectedDonation(donation); setConfirmDialog(true); }}>
                      Accept Donation
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary" sx={{ my: 4 }}>No donations available in your area</Typography>
              </Grid>
            )}
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
      <Footer />
    </Box>
  );
}

export default NGODashboard;

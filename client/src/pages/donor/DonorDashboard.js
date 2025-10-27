import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import {
  Container, Box, Typography, Grid, Card, CardContent, Button, Tabs, Tab, Chip, Badge,
  AppBar, Toolbar, IconButton
} from '@mui/material';
import {
  Add, Notifications, LocalShipping, CheckCircle, Cancel, HourglassEmpty
} from '@mui/icons-material';

function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, cancelled: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDonations();
    fetchUnreadCount();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await api.get(`/donations/donor/${auth.currentUser.uid}`);
      const donationsData = response.data.donations;
      setDonations(donationsData);
      setStats({
        total: donationsData.length,
        active: donationsData.filter(d => ['available', 'matched', 'in_transit'].includes(d.status)).length,
        delivered: donationsData.filter(d => d.status === 'delivered').length,
        cancelled: donationsData.filter(d => d.status === 'cancelled').length,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(`/notifications/${auth.currentUser.uid}/unread-count`);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusChip = (status) => {
    const config = {
      available: { label: 'Available', color: 'success', icon: <HourglassEmpty /> },
      matched: { label: 'Matched', color: 'info', icon: <CheckCircle /> },
      in_transit: { label: 'In Transit', color: 'warning', icon: <LocalShipping /> },
      delivered: { label: 'Delivered', color: 'success', icon: <CheckCircle /> },
      cancelled: { label: 'Cancelled', color: 'error', icon: <Cancel /> },
    }[status] || { label: status, color: 'default', icon: null };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        sx={{ fontWeight: 500, borderRadius: 1 }}
      />
    );
  };

  const filterDonations = () => {
    switch (activeTab) {
      case 1: return donations.filter(d => ['available', 'matched'].includes(d.status));
      case 2: return donations.filter(d => d.status === 'in_transit');
      case 3: return donations.filter(d => d.status === 'delivered');
      default: return donations;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#f4f7fa',
      overflow: 'hidden',
    }}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            DonatEat - Donor Portal
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/donor/notifications')}>
            <Badge badgeContent={unreadCount} color="error"><Notifications /></Badge>
          </IconButton>
          <Button color="inherit" startIcon={<Add />} onClick={() => navigate('/donor/create')} sx={{ ml: 2 }}>
            New Donation
          </Button>
          <Button color="secondary" variant="outlined" onClick={() => navigate('/logout')} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, pb: 4, flexGrow: 1 }}>
        {/* Improved Stats Cards */}
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="flex-start"
          sx={{ mb: 4 }}
        >
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{
              borderRadius: 4,
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 20 }}>Total Donations</Typography>
              <Typography variant="h1" sx={{ fontWeight: 700, color: "#234F1E" }}>{stats.total}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{
              borderRadius: 4,
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 20 }}>Active</Typography>
              <Typography variant="h1" sx={{ fontWeight: 700, color: "#388e3c" }}>{stats.active}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{
              borderRadius: 4,
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 20 }}>Delivered</Typography>
              <Typography variant="h1" sx={{ fontWeight: 700, color: "#388e3c" }}>{stats.delivered}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{
              borderRadius: 4,
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 20 }}>Impact</Typography>
              <Typography variant="h1" sx={{ fontWeight: 700, color: "#234F1E" }}>
                {stats.delivered * 25}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, fontWeight: 500 }}>people fed</Typography>
            </Card>
          </Grid>
        </Grid>

        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            mb: 3,
            background: "#fff",
            borderRadius: 2,
            boxShadow: 1,
          }}
          TabIndicatorProps={{
            style: { height: 4, borderRadius: 2 }
          }}
        >
          <Tab label="All" />
          <Tab label="Active" />
          <Tab label="In Transit" />
          <Tab label="Delivered" />
        </Tabs>

        <Grid container spacing={2}>
          {filterDonations().map((donation) => (
            <Grid item xs={12} key={donation.id}>
              <Card elevation={3} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Box
                        component="img"
                        sx={{
                          width: '100%',
                          borderRadius: 2,
                          boxShadow: 1,
                          maxHeight: 140,
                          objectFit: 'cover',
                          background: '#f7f7f7'
                        }}
                        src={donation.imageUrl}
                        alt={donation.foodDetails.foodName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">{donation.foodDetails.foodName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Servings: {donation.foodDetails.estimatedServings} | {donation.foodDetails.category}
                      </Typography>
                      <Typography variant="body2">
                        Posted: {new Date(donation.createdAt).toLocaleDateString()}
                      </Typography>
                      {donation.matchedNGO && (
                        <Typography variant="body2" color="primary">
                          Matched with NGO
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                      {getStatusChip(donation.status)}
                      {donation.deliveryDetails && (
                        <Button
                          size="small"
                          variant="text"
                          sx={{ mt: 1 }}
                          onClick={() => window.open(donation.deliveryDetails.trackingUrl, '_blank')}
                        >
                          Track Delivery
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}

export default DonorDashboard;

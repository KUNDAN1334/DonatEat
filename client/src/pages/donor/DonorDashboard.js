import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardContent, Button, Tabs, Tab, Chip, Badge, AppBar, Toolbar, IconButton
} from '@mui/material';
import { Add, Notifications, LocalShipping, CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';

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
    return <Chip label={config.label} color={config.color} icon={config.icon} size="small" />;
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
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>DonatEat - Donor Portal</Typography>
          <IconButton color="inherit" onClick={() => navigate('/donor/notifications')}>
            <Badge badgeContent={unreadCount} color="error"><Notifications /></Badge>
          </IconButton>
          <Button color="inherit" startIcon={<Add />} onClick={() => navigate('/donor/create')}>New Donation</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card><CardContent><Typography color="text.secondary">Total Donations</Typography><Typography variant="h3">{stats.total}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card><CardContent><Typography color="text.secondary">Active</Typography><Typography variant="h3" color="primary">{stats.active}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card><CardContent><Typography color="text.secondary">Delivered</Typography><Typography variant="h3" color="success.main">{stats.delivered}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card><CardContent><Typography color="text.secondary">Impact</Typography><Typography variant="h3">{stats.delivered * 25}</Typography><Typography variant="caption">people fed</Typography></CardContent></Card>
          </Grid>
        </Grid>

        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ mb: 3 }}>
          <Tab label="All" />
          <Tab label="Active" />
          <Tab label="In Transit" />
          <Tab label="Delivered" />
        </Tabs>

        <Grid container spacing={2}>
          {filterDonations().map((donation) => (
            <Grid item xs={12} key={donation.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <img src={donation.imageUrl} alt={donation.foodDetails.foodName} style={{ width: '100%', borderRadius: 8 }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">{donation.foodDetails.foodName}</Typography>
                      <Typography variant="body2" color="text.secondary">Servings: {donation.foodDetails.estimatedServings} | {donation.foodDetails.category}</Typography>
                      <Typography variant="body2">Posted: {new Date(donation.createdAt).toLocaleDateString()}</Typography>
                      {donation.matchedNGO && <Typography variant="body2" color="primary">Matched with NGO</Typography>}
                    </Grid>
                    <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                      {getStatusChip(donation.status)}
                      {donation.deliveryDetails && (
                        <Button size="small" sx={{ mt: 1 }} onClick={() => window.open(donation.deliveryDetails.trackingUrl, '_blank')}>Track Delivery</Button>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default DonorDashboard;

import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import api from '../../services/api';
import {
  Container, Box, Typography, Card, CardContent, Button, List, ListItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { CheckCircle, Cancel, LocalShipping } from '@mui/icons-material';

function DonorNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications/${auth.currentUser.uid}`);
      setNotifications(res.data.notifications);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeliveryDecision = async (approved) => {
    setLoading(true);
    try {
      await api.put(`/api/donations/${selectedNotification.donationId}/delivery-approval`, {
        approved,
        donorId: auth.currentUser.uid
      });
      await api.put(`/notifications/${selectedNotification.id}/read`);
      alert(approved ? 'Delivery approved! Porter booking initiated.' : 'Delivery declined. NGO will arrange pickup.');
      setDialogOpen(false);
      fetchNotifications();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingApprovals = notifications.filter(n => n.requiresApproval && !n.read);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Notifications & Approvals</Typography>
      {pendingApprovals.length > 0 && <Alert severity="warning" sx={{ mb: 3 }}>You have {pendingApprovals.length} pending delivery approval(s)</Alert>}

      {notifications.map(notification => (
        <Card key={notification.id} sx={{ mb: 2, bgcolor: notification.read ? 'white' : '#fff3e0', border: notification.requiresApproval && !notification.read ? '2px solid #ff9800' : 'none' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <Box>
                <Typography variant="h6">{notification.title}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>{notification.message}</Typography>
                {notification.ngoName && <Typography variant="body2"><strong>NGO:</strong> {notification.ngoName}</Typography>}
                <Typography variant="caption" color="text.secondary">{new Date(notification.createdAt?.toDate()).toLocaleString()}</Typography>
              </Box>
              <Box>
                {notification.requiresApproval && !notification.read && (
                  <Button variant="contained" color="warning" startIcon={<LocalShipping />} onClick={() => { setSelectedNotification(notification); setDialogOpen(true); }}>
                    Review Request
                  </Button>
                )}
                {notification.type === 'delivery_status_update' && (
                  <Chip label={notification.message.includes('delivered') ? 'Delivered' : 'In Transit'} color={notification.message.includes('delivered') ? 'success' : 'info'} />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {notifications.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          No notifications yet
        </Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delivery Approval Required</DialogTitle>
        <DialogContent>
          <Typography paragraph><strong>{selectedNotification?.ngoName}</strong> has requested delivery service for your donation.</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            If you approve, Porter will be booked automatically to deliver the food. If you decline, the NGO will arrange their own pickup.
          </Alert>
          <Typography variant="body2">Food: {selectedNotification?.message.match(/your (.*)/)?.[1]}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDeliveryDecision(false)} disabled={loading} color="error" startIcon={<Cancel />}>Decline Delivery</Button>
          <Button onClick={() => handleDeliveryDecision(true)} disabled={loading} variant="contained" startIcon={<CheckCircle />}>Approve & Book Porter</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DonorNotifications;

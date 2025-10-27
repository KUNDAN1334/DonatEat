import React from 'react';
import { Button, Box, Typography, Paper } from '@mui/material';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };
  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: '#f4f7fa' }}>
      <Paper elevation={4} sx={{ padding: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Are you sure you want to logout?</Typography>
        <Button variant="contained" color="primary" onClick={handleLogout} sx={{ mt: 2, width: '60%' }}>Logout</Button>
      </Paper>
    </Box>
  );
}
export default Logout;

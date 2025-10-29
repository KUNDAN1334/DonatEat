import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import api from './services/api';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';

function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', userType: 'donor' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Step 1: Creating Firebase Auth user for:', form.email);
      
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      
      console.log('Step 1 Complete: Firebase Auth user created:', user.uid);

      // Step 2: Get auth token
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      console.log('Step 2 Complete: Auth token saved');

      // Step 3: Save user details to backend Firestore
      console.log('🔹 Step 3: Saving user data to backend...');
      
      try {
        const response = await api.post('/api/auth/register', {
          uid: user.uid,
          email: form.email,
          name: form.name,
          phone: form.phone,
          userType: form.userType
        });
        
        console.log('Step 3 Complete: Backend registration successful:', response.data);
      } catch (backendError) {
        // If backend fails but Firebase Auth succeeded, still allow login
        console.warn('Backend registration failed, but Firebase Auth succeeded:', backendError);
        console.log('Proceeding with navigation...');
      }

      // Step 4: Navigate to appropriate dashboard
      console.log('🔹 Step 4: Navigating to dashboard...');
      const dashboardPath = form.userType === 'donor' ? '/donor/dashboard' : '/ngo/dashboard';
      navigate(dashboardPath);
      
      console.log('Registration flow complete!');
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle Firebase Auth errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code) {
        setError(`Firebase error: ${err.message}`);
      } else if (err.response) {
        setError(`Server error: ${err.response.data.error || err.response.statusText}`);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>Register</Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField 
            label="Name" 
            required 
            fullWidth 
            margin="normal" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            disabled={loading}
          />
          <TextField 
            label="Email" 
            type="email" 
            required 
            fullWidth 
            margin="normal" 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
            disabled={loading}
          />
          <TextField 
            label="Phone" 
            required 
            fullWidth 
            margin="normal" 
            value={form.phone} 
            onChange={e => setForm({ ...form, phone: e.target.value })} 
            disabled={loading}
          />
          <TextField 
            label="Password" 
            type="password" 
            required 
            fullWidth 
            margin="normal" 
            value={form.password} 
            onChange={e => setForm({ ...form, password: e.target.value })} 
            disabled={loading}
            helperText="Minimum 6 characters"
          />
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel>I am a</InputLabel>
            <Select 
              value={form.userType} 
              label="I am a" 
              onChange={e => setForm({ ...form, userType: e.target.value })}
            >
              <MenuItem value="donor">Food Donor</MenuItem>
              <MenuItem value="ngo">NGO/Shelter</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 2 }} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
          </Button>
          
          <Button 
            fullWidth 
            variant="text" 
            sx={{ mt: 1 }} 
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Already have an account? Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Register;

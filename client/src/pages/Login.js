import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', token);
      const response = await api.get(`/api/auth/profile/${userCredential.user.uid}`);
      const userType = response.data.userType;
      navigate(userType === 'donor' ? '/donor/dashboard' : '/ngo/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>Login</Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField label="Email" type="email" required fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
          <TextField label="Password" type="password" required fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Login</Button>
          <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => navigate('/register')}>Create Account</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;

import React from 'react';
import { Box, Typography, Link } from '@mui/material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 4,
        mt: 'auto',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        textAlign: 'center',
        position: 'relative',
        bottom: 0,
        width: '100%'
      }}
    >
      <Typography variant="body2">
        &copy; {new Date().getFullYear()} DonatEat. All rights reserved. | Built with ❤️ by Contributors.
      </Typography>
      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
        <Link href="https://github.com/KUNDAN1334/DonatEat" target="_blank" rel="noopener" color="inherit" underline="hover">
          GitHub Repository
        </Link>
      </Typography>
    </Box>
  );
}

export default Footer;

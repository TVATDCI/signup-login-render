import { Typography, Container, Box } from "@mui/material";

function Auth() {
  return (
    <Container>
      <Box sx={{ my: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Authentication Portal
        </Typography>
        <Typography variant="body1" paragraph>
          Please sign up or log in to explore the authentication features. After
          logging in, you can access protected admin routes. You can also
          inspect HTTP-only cookies through the browser dev tools.
        </Typography>
      </Box>
    </Container>
  );
}

export default Auth;

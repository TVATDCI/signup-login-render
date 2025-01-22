import { AppBar, Box, Button, Toolbar } from "@mui/material";

export default function NavBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="absolute">
        <Toolbar>
          <Button variant="contained" href="/login">
            Login
          </Button>
          <Button variant="contained" href="/logout">
            Logout
          </Button>
          <Button variant="contained" href="/register">
            Register
          </Button>
          <Button variant="contained" href="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

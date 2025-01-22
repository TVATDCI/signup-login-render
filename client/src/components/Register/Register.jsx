import axios from "axios";
import { useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  Input,
  InputLabel,
} from "@mui/material";

export default function Register() {
  const [formError, setFormError] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const data = {
      username: formData.get("username"),
      firstname: formData.get("firstname"), // Corrected this line
      lastname: formData.get("lastname"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      await axios.post("http://localhost:3001/api/user/register", data, {
        withCredentials: true,
      });

      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
      }, 2000);
    } catch (error) {
      console.log(error);
      setFormError(true);
      setTimeout(() => {
        setFormError(false);
      }, 2000);
    }
  };

  return (
    <div style={{ padding: 16, margin: "auto", maxWidth: 600 }}>
      {formError ? (
        <Alert severity="error">Error registering user!</Alert>
      ) : null}
      {formSuccess ? <Alert severity="success">User registered!</Alert> : null}
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="flex-start" spacing={2} columns={[2]}>
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel htmlFor="username">Username</InputLabel>
              <Input name="username" id="username" required={true} />
            </FormControl>
          </Grid>
          <Grid item xs={1}>
            <FormControl fullWidth>
              <InputLabel htmlFor="firstname">First Name</InputLabel>
              <Input name="firstname" id="firstname" required={true} />
            </FormControl>
          </Grid>
          <Grid item xs={1}>
            <FormControl fullWidth>
              <InputLabel htmlFor="lastname">Last Name</InputLabel>
              <Input name="lastname" id="lastname" required={true} />
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel htmlFor="email">Email address</InputLabel>
              <Input
                name="email"
                type="email"
                id="email"
                required={true}
                aria-describedby="my-helper-text"
              />
              <FormHelperText id="my-helper-text">
                We'll never share your email.
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel htmlFor="password">Password</InputLabel>
              <Input
                name="password"
                type="password"
                id="password"
                required={true}
              />
            </FormControl>
          </Grid>
          <Grid item xs={2}>
            <Button type="submit" variant="contained">
              Register
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}

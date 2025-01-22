import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get("/app/user/logout", {
        withCredentials: true,
      });
      navigate("/");
    } catch (error) {}
  };

  useEffect(() => {
    handleLogout();
  }, []);

  return (
    <div>
      <h1>Logging out...</h1>
    </div>
  );
}

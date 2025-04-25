import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user/logout`, {
        withCredentials: true,
      });
      navigate("/");
    } catch (error) {
      console.log("logout failed", error);
    }
  };
  // eslint moans handleLogout inside useEffect is not listed in the dependency!
  // handleLogout is defined inside the component and does not depend on any props or state.
  // To avoid: Use logout(); }, [];
  useEffect(() => {
    handleLogout();
  }, []);

  return (
    <div>
      <h1>Logging out..!</h1>
    </div>
  );
}

{
  /**
  * 
  * Optional Tip:
  * If you want to avoid changing URLs manually in multiple places,
  * you can store the base API URL in an environment variable in your frontend code, like:
  * const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
  * await axios.post(`${API_BASE_URL}/api/user/register`, data, {
  withCredentials: true,
});

   */
}

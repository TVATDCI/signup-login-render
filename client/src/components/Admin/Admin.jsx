import axios from "axios";
import { useEffect, useState } from "react";

export default function Admin() {
  const [isAuthorized, setIsAuthorized] = useState(0);

  const getAdmin = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user/admin`, {
        withCredentials: true,
      });

      setIsAuthorized(1);
    } catch (error) {
      setIsAuthorized(0);
    }
  };

  useEffect(() => {
    getAdmin();
  }, []);

  return (
    <div>
      {isAuthorized ? (
        <h1>You are authorized to view this content</h1>
      ) : (
        <h1>Access Denied 🚫 You are unauthorized!!</h1>
      )}
    </div>
  );
}

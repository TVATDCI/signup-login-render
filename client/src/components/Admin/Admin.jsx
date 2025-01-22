import axios from "axios";
import { useEffect, useState } from "react";

export default function Admin() {
  const [isAuthorized, setIsAuthorized] = useState(0);

  const getAdmin = async () => {
    try {
      await axios.get("/app/user/admin", {
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
        <h1>You are unauthorized!!</h1>
      )}
    </div>
  );
}

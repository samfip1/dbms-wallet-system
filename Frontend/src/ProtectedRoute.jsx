import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
    const [isAuth, setIsAuth] = useState(null); 

    useEffect(() => {
        axios
            .get("/verify")
            .then(() => setIsAuth(true))
            .catch(() => setIsAuth(false));
    }, []);

    if (isAuth === null) {
        return <p>Loading...</p>; // or a spinner
    }

    if (!isAuth) {
        alert("You need to sign in to access this page.");
        return <Navigate to="/user/signin" replace />;
    }

    return children;
};

export default ProtectedRoute;
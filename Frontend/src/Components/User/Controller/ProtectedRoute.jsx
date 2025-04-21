import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    console.log(token + " token in protected route");

    if (!token) {
        alert("You need to sign in to access this page.");
        return <Navigate to="/user/signin" replace />;
    }

    return children;
};

export default ProtectedRoute;

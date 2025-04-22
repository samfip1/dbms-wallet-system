import React from "react";
import axios from "axios";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import Signup from "./Components/User/Controller/Signup";
import Profile from "./Components/User/Component/Profile";
import UserSignIn from "./Components/User/Controller/Signin";
import Balance from "./Components/User/Component/Balance";
import Transfer from "./Components/User/Component/Transfer";
import Pro from "./Components/User/Component/Pro";
import ProtectedRoute from "./ProtectedRoute";

axios.defaults.baseURL = "http://localhost:3000"; 
axios.defaults.withCredentials = true;

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Signup />} />
                <Route path="/user/signin" element={<UserSignIn />} />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/user/balance"
                    element={
                        <ProtectedRoute>
                            <Balance />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/user/transfer"
                    element={
                        <ProtectedRoute>
                            <Transfer />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/user/profile"
                    element={
                        <ProtectedRoute>
                            <Pro />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;
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
import AdminSignUp from "./Components/Admin/Controller/Signup";
import AdminSignIn from "./Components/Admin/Controller/Signin";
import AdminDashboard from "./Components/Admin/Component/AdminDashboard";
import AdminProfile from "./Components/Admin/Component/Profile";
import BlockUser from "./Components/Admin/Component/BlockUser";
import AdminUpdate from "./Components/Admin/Component/AdminUpdate";
import Userlist from "./Components/Admin/Component/Userlist";
import Freezemoney from "./Components/Admin/Component/Freezemoney";
import Update from "./Components/User/Component/Update";
import LoginActivity from "./Components/User/Component/loginActivity";


axios.defaults.baseURL = "http://localhost:3000"; 
axios.defaults.withCredentials = true;

function App() {
    return (
        <Router>
            <Routes>
                {/* User Routes */}
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
                    path="/user/update"
                    element={
                        <ProtectedRoute>
                            <Update />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/user/loginActivity"
                    element={
                        <ProtectedRoute>
                            <LoginActivity />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/user/transaction"
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


                {/* Admin Routes */}
                <Route
                    path="/admin/signup"
                    element={
                            <AdminSignUp />
                    }
                />

                <Route
                    path="/admin/signin"
                    element={
                            <AdminSignIn />
                    }
                />

                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/profile"
                    element={
                        <ProtectedRoute>
                            <AdminProfile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/BlockUser"
                    element={
                        <ProtectedRoute>
                            <BlockUser />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/update"
                    element={
                        <ProtectedRoute>
                            <AdminUpdate />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/UsersList"
                    element={
                        <ProtectedRoute>
                            <Userlist />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/FreezeMoney"
                    element={
                        <ProtectedRoute>
                            <Freezemoney />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
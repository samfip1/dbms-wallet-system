import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signup from "./Components/User/Controller/Signup";
import Profile from "./Components/User/Component/Profile";
import UserSignIn from "./Components/User/Controller/Signin";
import Balance from "./Components/User/Component/Balance";
import Transfer from "./Components/User/Component/Transfer";
import ProtectedRoute from "./Components/User/Controller/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Signup />} />
                <Route path="/dashboard" element={<Profile />} />
                <Route path="/user/signin" element={<UserSignIn />} />
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
                            {" "}
                            <Transfer />{" "}
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

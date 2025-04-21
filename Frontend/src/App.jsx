import { useEffect, useState } from "react";
import "./App.css";
import  axios from "axios";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signup from "./Components/User/Controller/Signup";
import Profile from "./Components/User/Profile/Profile";
import UserSignIn from "./Components/User/Controller/Signin";

function App() {

    return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Signup />}/>
            <Route path="/dashboard" element={<Profile />}/>
            <Route path="/user/signin" element={<UserSignIn />} />
        </Routes>
    </BrowserRouter>
    )
}

export default App;

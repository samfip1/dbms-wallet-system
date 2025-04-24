import React, { useEffect, useState } from 'react'
import axios from 'axios'
function AdminProfile() {

    const [profile, setProfile] = useState({});

    useEffect(() => {
        const adminProfile = async () => {
            const res = await axios.get('http://localhost:3000/admin/profile', {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const adminPro = (res.data);
            console.log(adminPro);
            setProfile(adminPro);
        }
        adminProfile();
    }, [])

    return (
        <div>
            <h1>Profile</h1>
            {profile.addmin ? (
                <div>
                    <p>Account ID: {profile.addmin.admin_id}</p>
                    <p>Age: {profile.addmin.age}</p>
                    <p>Email: {profile.addmin.email}</p>
                    <p>Full Name: {profile.addmin.name}</p>
                    <p>Phone Number: {profile.addmin.phone}</p>
                    <p>Username: {profile.addmin.username}</p>
                </div>
            ) : (
                <p>Loading or no profile data available...</p>
            )}
        </div>
    );

}

export default AdminProfile
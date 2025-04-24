import axios from 'axios'
import React, { useEffect, useState } from 'react'

function Pro() {

    const [pro, setPro] = useState(0);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await axios.get('http://localhost:3000/user/profile', {
                    withCredentials: true,
                })
                const profie = (res.data);
                console.log(res.data);
                setPro(profie);
            } catch (error) {
                console.error('Error fetching balance:', error)
            }
        }
        fetchBalance()
    }, [])


    return (
        <div>
            <h1>Profile</h1>
            {pro ? (
                <div>
                    <p>Account ID: {pro.account_id}</p>
                    <p>Age: {pro.age}</p>
                    {pro.city && <p>City: {pro.city}</p>}
                    <p>Email: {pro.email}</p>
                    <p>Full Name: {pro.full_name}</p>
                    <p>Money: {pro.money}</p>
                    <p>Phone Number: {pro.phone_number}</p>
                    <p>Username: {pro.username}</p>
                </div>
            ) : (
                <p>Loading or no profile data available...</p>
            )}
        </div>
    );

}

export default Pro
import axios from 'axios';
import React, { useEffect, useState } from 'react';

function Userlist() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const res = await axios.get('http://localhost:3000/admin/UsersList', {
                    headers: {
                        "content-type": "application/json"
                    }
                });
                console.log(res.data);
                setUsers(res.data.allUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchAllUsers();
    }, []);

    return (
        <div>
            <h1 className='text-2xl font-bold'>Users List</h1>
            <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Money</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                        <tr key={user.user_id}>
                            <td className="px-6 py-4 whitespace-nowrap">{user.user_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.phone_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.city}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.age}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {user.money !== null ? `₹${parseFloat(user.money).toFixed(2)}` : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Userlist;

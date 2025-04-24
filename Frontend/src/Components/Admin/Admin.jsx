import React from 'react'
import { useNavigate } from 'react-router-dom'

function Admin() {
    const navigate = useNavigate();

    return (
        <div className="absolute top-4 left-4">
            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/admin/signin");
                }}
            >
                Admin Login
            </button>
        </div>
    )
}

export default Admin;

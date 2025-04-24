import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminUpdate() {
    const [error, setError] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const validate = () => {
        if (newUsername.length === 0) {
            setError("Please enter a comment.");
            return false;
        }
        setError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!validate()) return;
        setLoading(true);
    
        try {
            const response = await axios.post(
                "http://localhost:3000/user/update",
                {
                    newUsername
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
    
            console.log(response.data);
            setNewUsername(0);
            setNewUsername("");
            alert("Username Updated Succesfully!");

            setTimeout(() => {
                navigate("/user/dashboard");
            }, 800);
            
        } catch (err) {
            console.error("API Error:", err);
            setError("Updation Failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                    

                <div>
                    <label htmlFor="newUsername">Comments</label>
                    <input
                        type="text"
                        id="newUsername"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter new Username"
                    />
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {loading ? "Updating Username..." : "Update Username"}
                </button>
            </form>
        </div>
    );
}

export default AdminUpdate;

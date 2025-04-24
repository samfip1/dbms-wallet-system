import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Freezmoney() {
    const [userId, setuserId] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const validate = () => {
        if (userId <= 0) {
            setError("Please enter a valid receiver user ID.");
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
                "http://localhost:3000/admin/FreezeMoney",
                {
                    userId
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
    
            console.log(response.data);
            setuserId(0);
            alert("User Money Deducted Succesfully!");
            setTimeout(() => {
                navigate("/admin/dashboard");
            }, 800);
            
        } catch (err) {
            console.error("API Error:", err);
            setError("Deduction failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">     
                <div>
                    <label htmlFor="userId">Receiver User ID</label>
                    <input
                        type="number"
                        id="userId"
                        value={userId}
                        onChange={(e) => setuserId(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter receiver's ID"
                    />
                </div>
                {error && <p className="text-red-500">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {loading ? "Freeze User..." : "FReeze money User"}
                </button>
            </form>
        </div>
    );
}

export default Freezmoney;

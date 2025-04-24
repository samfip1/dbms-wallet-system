import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Transfer() {
    const [money, setMoney] = useState(0);
    const [receiverUser_id, setReceiverUser_id] = useState(0);
    const [transaction_pin, setTransaction_pin] = useState("");
    const [comments, setComments] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const validate = () => {
        if (money <= 0) {
            setError("Please enter a valid amount to transfer.");
            return false;
        }
        if (receiverUser_id <= 0) {
            setError("Please enter a valid receiver user ID.");
            return false;
        }
        if (transaction_pin.length !== 4) {
            setError("Please enter a valid 4-digit transaction pin.");
            return false;
        }
        if (comments.length === 0) {
            setError("Please enter a comment.");
            return false;
        }
        setError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // prevent page reload
    
        if (!validate()) return;
    
        setLoading(true);
    
        try {
            const response = await axios.post(
                "http://localhost:3000/user/transaction",
                {
                    money,
                    receiverUser_id,
                    transaction_pin,
                    comments,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
    
            console.log(response.data);
            setMoney(0);
            setReceiverUser_id(0);
            setTransaction_pin("");
            setComments("");
    
            alert("Transfer successful!");

            setTimeout(() => {
                navigate("/dashboard");
            }, 800);
            
        } catch (err) {
            console.error("API Error:", err);
            setError("Transaction failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="money">Amount to Transfer</label>
                    <input
                        type="number"
                        id="money"
                        value={money}
                        onChange={(e) => setMoney(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter amount"
                    />
                </div>

                <div>
                    <label htmlFor="receiverUser_id">Receiver User ID</label>
                    <input
                        type="number"
                        id="receiverUser_id"
                        value={receiverUser_id}
                        onChange={(e) => setReceiverUser_id(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter receiver's ID"
                    />
                </div>

                <div>
                    <label htmlFor="transaction_pin">Transaction PIN</label>
                    <input
                        type="password"
                        id="transaction_pin"
                        value={transaction_pin}
                        onChange={(e) => setTransaction_pin(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter 4-digit PIN"
                    />
                </div>

                <div>
                    <label htmlFor="comments">Comments</label>
                    <input
                        type="text"
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Enter a comment"
                    />
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {loading ? "Transferring..." : "Transfer"}
                </button>
            </form>
        </div>
    );
}

export default Transfer;

import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();
    return (
        <div className="absolute top-4 left-4">
            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/admin/profile");
                }}
            >
                Profile
            </button>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/admin/BlockUser");
                }}
            >
                Block User
            </button>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/admin/update");
                }}
            >
                Update Username
            </button>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/admin/UsersList");
                }}
            >
                User List
            </button>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/admin/FreezeMoney");
                }}
            >
                Freeze Money
            </button>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/dbms-project/leaderboard");
                }}
            >
                LeaderBoard
            </button>

            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    const logout = async () => {
                        try {
                            const res = await axios.get(
                                "http://localhost:3000/admin/logout",
                                { withCredentials: true }
                            );
                            console.log(res.data);
                            navigate("/admin/signin");
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    logout()
                }}
            >
                Logout
            </button>
        </div>
    );
}

export default AdminDashboard;

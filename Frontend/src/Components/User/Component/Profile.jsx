import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    // const handleSubmit = async () => {
    //     try {
    //         setLoading(true);
    //         const res = await axios.get("http://localhost:3000");
    //         setData(res.data);
    //     } catch (err) {
    //         setError(err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     handleSubmit();
    // }, []);

    return (
        <div>
            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/user/transfer");
                }}
            >
                Transfer Money
            </button>
            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/user/profile");
                }}
            >
                Profile
            </button>
            <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded"
                onClick={() => {
                    navigate("/user/Balance");
                }}
            >
                Balance
            </button>
        </div>
    );
}

export default Profile;

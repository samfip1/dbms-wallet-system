import axios from "axios";
import React, { useEffect, useState } from "react";

function Profile() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            <h1>Profile</h1>
            <button
                type="submit"
                className={`w-full py-3 px-4 rounded-md font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                    Profile       
            </button>
        </div>
    );
}

export default Profile;

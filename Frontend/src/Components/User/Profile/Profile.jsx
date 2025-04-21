import axios from 'axios';
import React, { useEffect, useState } from 'react';

function Profile() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:3000");
            setData(res.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSubmit();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Profile</h1>
            <button onClick={handleSubmit}>Get Data</button>
            {error && <p>{error.message}</p>}
            {data && <p>{JSON.stringify(data)}</p>}
        </div>
    );
}

export default Profile;

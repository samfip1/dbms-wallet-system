import axios from 'axios';
import React, { useEffect } from 'react';

function LoginActivity() {
    const [loginActivity, setLoginActivity] = React.useState([]);

    useEffect(() => {
        const fetchLoginActivity = async () => {
            try {
                const res = await axios.get('http://localhost:3000/user/loginActivity', {
                    withCredentials: true,
                });
                const activity = res.data.loginActivity;
                console.log(res.data.loginActivity);
                setLoginActivity(activity);
            } catch (error) {
                console.error('Error fetching login activity:', error);
            }
        };
        fetchLoginActivity();
    }, []);

    return (
        <div>
            <h1>Login Activity</h1>
            {loginActivity.length > 0 ? (
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>Login ID</th>
                            <th>User ID</th>
                            <th>Login Time</th>
                            <th>Device IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loginActivity.map((activity, index) => (
                            <tr key={index}>
                                <td>{activity.login_id}</td>
                                <td>{activity.user_id}</td>
                                <td>{activity.login_time}</td>
                                <td>{activity.device_ip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No login activity available.</p>
            )}
        </div>
    );
}

export default LoginActivity;

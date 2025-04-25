import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/leaderboard');
        setLeaderboardData(response.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  if (error) {
    return <div>Error: {error.message || 'Something went wrong.'}</div>;
  }

  return (
    <div>
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Money</th>
            <th>Total Transactions</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((item) => (
            <tr key={item.leaderboard_id}>
              <td>{item.user_id}</td>
              <td>{item.money}</td>
              <td>{item.total_transactions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;

import React, { useEffect, useState } from 'react'
import axios from 'axios'

function Balance() {

    const [balance, setBalance] = useState(-1);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await axios.get('http://localhost:3000/user/balance', {
                    withCredentials: true,
                })
                const money = (res.data.balance[0].money);
                console.log(res.data.balance[0].money);
                setBalance(money);
            } catch (error) {
                console.error('Error fetching balance:', error)
            }
        }
        fetchBalance()
    }, [])


    return (
        <div>
            <h1>Balance</h1>
            <p>{balance}</p>
        </div>
    )
}

export default Balance


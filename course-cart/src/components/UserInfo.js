// src/components/UserInfo.js
import React, { useState, useEffect } from 'react';
import Purchased from './Purchased.js'

const UserInfo = ({ user }) => {
  const [purchases, setPurchases] = useState([]);
  
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/purchases?userId=${user._id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setPurchases(data);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };
    fetchPurchases();
    
  }, []);
  
  return (
    <div>
      <h2>Welcome {user.name}</h2>
      <p>Degree: {user.course}</p>
      <p>Email: {user.email}</p>
	   <div className="purchases">
            <Purchased
              boughtCourses={purchases}
            />
        </div>
      {/* Add more user info as needed */}
    </div>
  );
};

export default UserInfo;


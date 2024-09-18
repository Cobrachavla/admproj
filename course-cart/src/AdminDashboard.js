import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import './app3.css';
import CourseList from './components/CourseList';
import UserInfo from './components/purchased-admin';
import VerificationButton from './components/VerificationButton';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    // Get user from local storage
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedUser) {
      setUser(storedUser);
    } else {
      console.error('No user found in local storage');
    }

    // Fetch purchases if the user is an admin
    if (storedUser && storedUser.type === "admin") {
      const fetchPurchases = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/purchases-admin');
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
    }

  }, []);

  if (!user) {
    return <div>No user found</div>;
  }

  if (user.type !== "admin") {
    return <div>Access denied: {user.type}</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Admin Dashboard</h1>
        <Link to="/">
          <button className="logout" onClick={() => {
            localStorage.removeItem('user');
          }}>
            Logout
          </button>
        </Link>
      </header>
      <div className="content">
        <div className="left-column">
          <UserInfo boughtCourses={purchases} />
        </div>
        <div className="right-column">
          <CourseList status='verified' />
        </div>
        <div className="verification-container">
          <Link to="/students">
            <VerificationButton />
          </Link>
        </div>
        <div className="navigation-container">
          <Link to="/college-details">
            <button className="college-button">College Details</button>
          </Link>
          <Link to="/student-details">
            <button className="student-button">Student Details</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

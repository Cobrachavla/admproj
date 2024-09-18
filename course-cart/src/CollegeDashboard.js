import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import CollegeInfo from './components/CollegeInfo';
import AddCourse from './components/AddCourse';
import CourseSelector from './components/CourseSelector';
import './App2.css';

const App = () => {
  const [user, setUser] = useState({'id': '', 'name': '', 'email': '', 'college': '','password': '', 'type': ''});
  
  useEffect(() => {
    // Retrieve user data from local storage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    } else {
      // Fetch user data from API if not found in local storage
      const fetchUser = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/user');
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          // Save user data to local storage
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };
      
      fetchUser();
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        // Clear user data from local storage
        localStorage.removeItem('user');
        setUser({'id': '', 'name': '', 'email': '', 'college': '','password': '', 'type': ''});
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      <Link to="/">
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </Link>
      <div className="row user-info">
        <CollegeInfo user={user} />
      </div>
      <div className="row main-content c">
        <div className="addcourse">
          <h3>Add Course</h3>
          <AddCourse />
        </div>
        <div className="removecourse">
          <h3>Remove Course</h3>
          <CourseSelector />
        </div>
      </div>
    </div>
  );
};

export default App;

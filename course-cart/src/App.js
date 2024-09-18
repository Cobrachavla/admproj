import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import UserInfo from './components/UserInfo';
import Filters from './components/Filters';
import CourseCard from './components/CourseCard';
import FixedBottom from './components/FixedBottom';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ branches: [], districts: [] });
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [cart, setCart] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    // Load user from local storage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    console.log('User from localStorage:', storedUser); // Debug log
    if (storedUser) {
      setUser(storedUser);
    } else {
      console.error('No user found in localStorage.');
    }

    // Fetch filters from the API
    const fetchFilters = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/filters');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setFilters(data);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch courses, cart, and purchases only if user is logged in
      const fetchCourses = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/courses?degree=${user.course}`);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          setCourses(data);
        } catch (error) {
          console.error('Error fetching courses:', error);
        }
      };

      const fetchCart = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/cart');
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          setCart(data);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      };

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
      
      fetchCourses();
      fetchCart();
      fetchPurchases();
    }
  }, [user]);

  const handleApplyFilters = (branches, districts) => {
    setSelectedBranches(branches);
    setSelectedDistricts(districts);

    const fetchFilteredCourses = async () => {
      try {
        const branchQuery = branches.join(',');
        const distQuery = districts.join(',');
        const response = await fetch(`http://localhost:5000/api/courses?degree=${user.course}&branch=${branchQuery}&district=${distQuery}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching filtered courses:', error);
      }
    };
    fetchFilteredCourses();
  };

  const handleResetFilters = () => {
    setSelectedBranches([]);
    setSelectedDistricts([]);

    const fetchCourses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/courses?degree=${user.course}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  };

  const handleAddToCart = async (course) => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course }),
      });
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromCart = async (courseId) => {
    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleBuyNow = async (course) => {
    const user = JSON.parse(localStorage.getItem('user')); // Retrieve logged-in user from localStorage
    if (!user) {
      console.error('No logged-in user found.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user, // Send the logged-in user
          course: course, // Send the selected course
        }),
      });
      if (!response.ok) {
        throw new Error('Error while processing the purchase.');
      }
      const updatedPurchases = await response.json();
      setPurchases(updatedPurchases); // Update purchases state if needed
      setCart([]); // Clear the cart after a successful purchase
      alert('Purchase successful!');
    } catch (error) {
      console.error('Error purchasing the course:', error);
    }
  };
    

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      localStorage.removeItem('user'); 
      setUser(null); 
      setCart([]); 
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
        <UserInfo user={user} degree={user.course} />
      </div>
      <div className="row main-content">
        <div className="filters">
          <h3 id="fixedheading">Apply Filters</h3>
          <Filters
            branches={filters.branches}
            districts={filters.districts}
            degree={user.course}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </div>
        <div className="courses">
          {courses.map((course, index) => (
            <CourseCard
            key={index}
            course={course}
            isInCart={cart.some(item => item.id === course.id)}
            isInPurchases={purchases.some(item => 
              String(item.user.id) === String(user.id) && String(item.course._id) === String(course._id)
            )}
            onBuyNow={() => handleBuyNow(course)}
            onAddToCart={() => handleAddToCart(course)}
            onRemoveFromCart={() => handleRemoveFromCart(course.id)}
          />
          ))}
        </div>
      </div>
      <div className="fixed-bottom">
        <FixedBottom cartCount={cart.length} />
      </div>
    </div>
  );
};

export default App;

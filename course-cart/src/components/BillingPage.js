import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import '../billing.css';

const BillingPage = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const totalCost = cart.reduce((total, course) => total + parseFloat(course.cost), 0);
  const platformFee = 50;
  const gst = (12/100)*totalCost;
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser); // Set user from localStorage
    }
  }, []); // Only run once when the component mounts
  
  useEffect(() => {
    if (user && user._id) {
      const fetchCart = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/cart?userId=${user._id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          setCart(data);
        } catch (error) {
          console.error('Error fetching cart:', error);
        }
      };
      fetchCart();
    }
  }, [user]); // Only re-run when user is set
   
  
  const handleRemoveFromCart = async (courseId) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) {
        console.error('User not found in localStorage.');
        return;
      }
  
      const response = await fetch('http://localhost:5000/api/cart', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: storedUser._id, courseId }),
      });
  
      if (!response.ok) {
        console.error(`Failed to remove item: ${response.status}`);
        return;
      }
  
      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };
  

  const handleBuyNow = (cart) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('User not logged in.');
      return;
    }
  
    const invtotal = totalCost + platformFee + gst;
    const num_c = cart.length - 1;
    const currentDate = new Date().toLocaleDateString(); // Get the current date
  
    let invoice = '';
    if (num_c === 0) {
      invoice = `Paid ${invtotal} Rs for this course on ${currentDate}`;
    } else if (num_c === 1) {
      invoice = `Paid ${invtotal} Rs for this course and 1 other on ${currentDate}`;
    } else {
      invoice = `Paid ${invtotal} Rs for this course and ${num_c} others on ${currentDate}`;
    }
  
    // Send purchase request to the backend
    fetch('http://localhost:5000/api/purchasesp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user._id, // Ensure user ID is sent
        cart, // Ensure cart data is structured correctly
        invoice,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        alert('Purchase successful!');
        setCart([]); // Clear the cart after the purchase is confirmed
      })
      .catch(error => {
        console.error('Error making purchase:', error);
      });
  };
  
  
  
  
  const handleBreakdown = () => {
    setShowBreakdown(!showBreakdown);
  };
  
  return (
    <div className="billing-page">
      <h2 className="billing-page-title">Your Cart</h2>
      <div className="cart-items">
        {cart.length > 0 ? (
          cart.map((course) => (
            <div key={course.id} className="cart-item">
              <span className="cart-item-title">{course.title}</span>
              <span className="cart-item-id">Course ID: {course.id}</span>
              <span className="cart-item-cost">{course.cost} Rs</span>
              <button className="remove-btn" onClick={() => handleRemoveFromCart(course._id)}>Remove</button>
            </div>
          ))
        ) : (
          <p className="empty-cart-message">Your cart is empty</p>
        )}
      </div>
      <div className="billing-summary">
        {totalCost>0?<h3 className="total-cost">Total: {totalCost+platformFee+gst} Rs</h3>: <h3 className="total-cost">Go back to course page</h3>}
        <button className="breakdown-btn" onClick={handleBreakdown} disabled={cart.length === 0}>
          Detailed Bill
        </button>
        <button className="buy-now-btn" onClick={() => handleBuyNow(cart)} disabled={cart.length === 0}>
          Buy Now
        </button>
        <Link to="/dashboard">
          <button className="go-to-dashboard">
            Back to Dashboard
          </button>
        </Link>
      </div>
      
      {showBreakdown && (
        <div className="breakdown-popup">
          <div className="breakdown-content">
            <h3>Cost Breakdown</h3>
            <p>Total Cost: {totalCost} Rs</p>
            <p>Platform Fee: {platformFee} Rs</p>
            <p>Tax: {gst.toFixed(2)} Rs</p>
            <button className="close-popup-btn" onClick={handleBreakdown}>Close</button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default BillingPage;


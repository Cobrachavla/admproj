import React, { useState, useEffect } from 'react';

const AddCourse = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    branch: '',
    district: '',
    cost: 0, // Initialize as integer
    intake: 0, // Initialize as integer
    cutoff: 0, // Initialize as integer
    college: '', // Added college field
    count: 0 // Initialize count to 0
  });
  const [userId, setUserId] = useState(null);

  // Retrieve the logged-in user's college and ID from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        college: user.college // Set the college field with logged-in user's college
      }));
      setUserId(user._id); // Set the user ID
    }
  }, []);

  // Form visibility toggle
  const handleButtonClick = () => {
    setShowForm(!showForm);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'cost' || name === 'intake' || name === 'cutoff' ? parseInt(value) || 0 : value
    });
  };

  // Handler to submit the form data
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Include the user ID in the form data
    const payload = { ...formData, userId };

    try {
      const response = await fetch('http://localhost:5000/api/add-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Include the user ID in the payload
      });

      if (!response.ok) {
        throw new Error('Failed to add course');
      }

      // Reset the form
      setFormData(prevData => ({
        ...prevData,
        title: '',
        description: '',
        branch: '',
        district: '',
        cost: 0, // Reset cost to 0
        intake: 0, // Reset intake to 0
        cutoff: 0, // Reset cutoff to 0
        count: 0 // Reset count to 0
      }));

      setShowForm(false);
      alert('Course posted for verification');
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {!showForm ? (
        <button
          onClick={handleButtonClick}
          style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'grey',
            color: 'white',
            fontSize: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
          +
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
          <label>Degree</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />

          <label>Description</label>
          <input type="text" name="description" value={formData.description} onChange={handleInputChange} required />

          <label>Branch</label>
          <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} required />

          <label>District</label>
          <input type="text" name="district" value={formData.district} onChange={handleInputChange} required />

          <label>Cost</label>
          <input type="number" name="cost" value={formData.cost} onChange={handleInputChange} required />

          <label>Intake</label>
          <input type="number" name="intake" value={formData.intake} onChange={handleInputChange} required />

          <label>Minimum Cutoff</label>
          <input type="number" name="cutoff" value={formData.cutoff} onChange={handleInputChange} required />

          {/* Display the college field but make it read-only */}
          <label>College</label>
          <input type="text" name="college" value={formData.college} readOnly />

          <button
            type="submit"
            style={{ marginTop: '10px', padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Course
          </button>
        </form>
      )}
    </div>
  );
};

export default AddCourse;

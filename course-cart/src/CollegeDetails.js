import React, { useState, useEffect } from 'react';
import './CollegeDetails.css';
const CollegeDetails = () => {
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    const fetchCollegeUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/college-users');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setColleges(data);
      } catch (error) {
        console.error('Error fetching college users:', error);
      }
    };

    fetchCollegeUsers();
  }, []);

  return (
    <div>
      <h2>College Login Users</h2>
      <div className="table-container">
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email</th>
            <th>User Type</th>
            <th>College</th>
            <th>Uploaded Courses</th>
          </tr>
        </thead>
        <tbody>
          {colleges.map((college) => (
            <tr key={college._id}>
              <td>{college.user?.name || "N/A"}</td>
              <td>{college.user?.email || "N/A"}</td>
              <td>{college.user?.type || "N/A"}</td>
              <td>{college.user?.college || "N/A"}</td>
              <td>
                <ul>
                  {college.courses.length > 0 ? (
                    college.courses.map((course) => (
                      <li key={course._id}>
                        {course.title} ({course.branch})
                      </li>
                    ))
                  ) : (
                    <li>No courses uploaded</li>
                  )}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default CollegeDetails;

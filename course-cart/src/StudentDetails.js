import React, { useState, useEffect } from 'react';
import './StudentDetails.css';
const StudentDetails = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudentUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/student-users');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error('Error fetching student users:', error);
      }
    };

    fetchStudentUsers();
  }, []);

  return (
    <div>
      <h2>Student Users</h2>
      <div className="table-container">
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Courses Purchased</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td>{student.user.name}</td>
              <td>{student.user.email}</td>
              <td>
                <ul>
                  {student.purchases.map((purchase) => (
                    <li key={purchase._id}>
                      {purchase.course.title} ({purchase.course.branch}) - 
                      {purchase.course.cost} Rs (Payment: {purchase.invoice})
                    </li>
                  ))}
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

export default StudentDetails;

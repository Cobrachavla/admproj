import React, { useState, useEffect } from 'react';

const CourseSelector = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/college-posts');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched courses:', data);
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  const handleSelect = (courseId) => {
    setSelectedCourses(prevSelected =>
      prevSelected.includes(courseId)
        ? prevSelected.filter(id => id !== courseId)
        : [...prevSelected, courseId]
    );
  };

  const handleRemove = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/remove-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedCourses }),
      });
      if (!response.ok) {
        throw new Error('Error removing courses');
      }
      const data = await response.json();
      console.log('Courses removed successfully:', data);
      setCourses(prevCourses => prevCourses.filter(course => !selectedCourses.includes(course._id)));
    } catch (error) {
      console.error('Error removing courses:', error);
    }
  
    setSelectedCourses([]);
  };
  
  return (
    <div>
      <ul>
        {courses.length > 0 ? (
          courses.map(course => (
            <li key={course._id}>
              <input
                type="checkbox"
                checked={selectedCourses.includes(course._id)}
                onChange={() => handleSelect(course._id)}
              />
              {course.title} {course.branch} {course.college} <i>status: {course.status}</i>
            </li>
          ))
        ) : (
          <li>No courses available</li>
        )}
      </ul>
      <button onClick={handleRemove} disabled={selectedCourses.length === 0}>
        Remove Selected Courses
      </button>
    </div>
  );
};

export default CourseSelector;

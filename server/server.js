import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const uri = 'mongodb+srv://1032211062:Vikend1beta@mydb.jpfxs.mongodb.net/?retryWrites=true&w=majority&appName=mydb';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, tls: true, tlsAllowInvalidCertificates: true });
let usersCollection;
let filtersCollection;
let coursesCollection;
let boughtCoursesCollection;
let cartCollection;
let cart = [];

app.use(session({
  secret: 'wsedrftgyhuuythjljkhghfty',  
  resave: false,  
  saveUninitialized: false,  
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, 
}));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB!');
    const db = client.db('mydb');
    usersCollection = db.collection('users');
    filtersCollection = db.collection('filters');
    coursesCollection = db.collection('courses');
    cartCollection = db.collection('cart');
    boughtCoursesCollection = db.collection('boughtCourses');
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}
connectToDB();
app.post('/api/register', async (req, res) => {
  try {
    const newUser = req.body;
    const user = await usersCollection.insertOne(newUser);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.post('/api/login', async (req, res) => {
  const { email, password, type } = req.body;
  try {
    const user = await usersCollection.findOne({ email, password, type });
    if (user) {
      req.session.userId = user._id;
      req.session.userType = user.type;
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
});
app.get('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});
app.get('/api/filters', async (req, res) => {
  try {
    const filters = await filtersCollection.findOne(); // Adjust based on your filter structure
    res.json(filters);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/courses', async (req, res) => {
  const { degree, branch, district } = req.query;
  try {
    let user = await usersCollection.findOne(); 
    let courses = await coursesCollection.find({ status: 'verified', cutoff: { $lte: user.percentile } }).toArray();
    if (degree) {
      courses = courses.filter(course => course.title === degree);
    }
    if (branch) {
      const branchArray = branch.split(',');
      courses = courses.filter(course => branchArray.includes(course.branch));
    }
    if (district) {
      const districtArray = district.split(',');
      courses = courses.filter(course => districtArray.includes(course.district));
    }
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching courses' });
  }
});
app.get('/api/cart', async (req, res) => {
  try {
    const userId = req.query.userId; // Adjust this based on your logic
    const userCart = await cartCollection.findOne({ userId });
    if (userCart) {
      res.status(200).json(userCart.cartItems); // Send the cart items to the client
    } else {
      res.status(404).json({ message: 'Cart not found' });
    }
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/api/cart', async (req, res) => {
  const { userId, course } = req.body;

  try {
    // Find the user's cart
    let userCart = await cartCollection.findOne({ userId });

    // If no cart exists, create a new one
    if (!userCart) {
      userCart = { userId, cartItems: [] };
    }

    // Check if the course is already in the cart
    const courseExists = userCart.cartItems.find(item => item._id === course._id);

    if (!courseExists) {
      // Add the course to the cart
      userCart.cartItems.push(course);
      await cartCollection.updateOne(
        { userId },
        { $set: { cartItems: userCart.cartItems } },
        { upsert: true } // Create the document if it doesn't exist
      );
    }

    res.status(200).json(userCart.cartItems); // Send the updated cart
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/cart', async (req, res) => {
  const { userId, courseId } = req.body;
  try {
    const userCart = await cartCollection.findOne({ userId });
    if (!userCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    // Remove the course from the cart
    const objectIdCourse = new ObjectId(courseId);
    userCart.cartItems = userCart.cartItems.filter(item => !objectIdCourse.equals(item._id));
    // Update the cart with the remaining items
    await cartCollection.updateOne(
      { userId },
      { $set: { cartItems: userCart.cartItems } }
    );
    res.status(200).json(userCart.cartItems); // Send the updated cart to the client
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/purchases', async (req, res) => {
  const { userId } = req.query; 
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is missing' });
  }
  try {
    const purchases = await boughtCoursesCollection.find({ 'user._id': new ObjectId(userId) }).toArray();
    res.status(200).json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, message: 'Error fetching purchases' });
  }
});
app.post('/api/purchasesp', async (req, res) => {
  try {
    const { userId, cart, invoice } = req.body;
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const userObjectId = new ObjectId(userId);
    const user = await usersCollection.findOne({ _id: userObjectId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!cart || !Array.isArray(cart) || cart.some(course => !ObjectId.isValid(course._id))) {
      return res.status(400).json({ success: false, message: 'Invalid course data in cart' });
    }
    
    const purchaseDetails = [];
    for (let course of cart) {
      const courseDetails = await coursesCollection.findOne({ _id: course._id });
      if (!courseDetails) {
        console.error(`Course with ID ${course._id} not found`);
        continue;
      }
      
      purchaseDetails.push({
        user: {
          _id: user._id,
          id: user.id,
          name: user.name,
          email: user.email,
          course: user.course,
          password: user.password,  
          type: user.type,
          percentile: user.percentile,
        },
        course: {
          _id: courseDetails._id,
          id: courseDetails.id,
          title: courseDetails.title,
          branch: courseDetails.branch,
          college: courseDetails.college,
          district: courseDetails.district,
          description: courseDetails.description,
          cost: courseDetails.cost,
          intake: courseDetails.intake,
          count: courseDetails.count,
          cutoff: courseDetails.cutoff,
          status: courseDetails.status,
        },
        purchaseDate: new Date(),
        invoice,
      });
    }
    
    if (purchaseDetails.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid purchases to save' });
    }

    // Save purchase details
    const result = await boughtCoursesCollection.insertMany(purchaseDetails);

    // Update course count
    await Promise.all(cart.map(course => 
      coursesCollection.updateOne(
        { _id: course._id },
        { $inc: { count: 1 } } // Increment the count by 1
      )
    ));

    // Clear the user's cart after successful purchase
    const deleteCartResult = await cartCollection.deleteMany({ userId: userId });

    res.status(200).json({ 
      success: true, 
      message: 'Purchase successful and cart cleared', 
      result, 
      deletedCartItems: deleteCartResult.deletedCount // Optionally send back the count of deleted cart items
    });
  } catch (error) {
    console.error('Error processing purchase:', error.message, error.stack);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Error processing purchase', error: error.message });
    }
  }
});


app.get('/api/college-posts', async (req, res) => {
  try {
    const courses = await coursesCollection.find({}).toArray();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Error fetching courses' });
  }
});
app.post('/api/remove-courses', async (req, res) => {
  const { selectedCourses } = req.body;
  console.log('Received selectedCourses:', selectedCourses);
  if (!Array.isArray(selectedCourses)) {
    return res.status(400).json({ success: false, message: 'Invalid data format' });
  }
  try {
    const objectIds = selectedCourses;
    const result = await coursesCollection.deleteMany({ _id: { $in: objectIds } });
    console.log('Delete result:', result); 
    res.status(200).json({ success: true, message: `Removed ${result.deletedCount} courses` });
  } catch (error) {
    console.error('Error removing courses:', error);
    res.status(500).json({ success: false, message: 'Error removing courses' });
  }
});
app.post('/api/add-course', async (req, res) => {
  try {
    const newCourse = req.body;
    const requiredFields = ['title', 'description', 'branch', 'district', 'cost', 'intake', 'cutoff', 'userId'];
    for (const field of requiredFields) {
      if (!newCourse[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }
    newCourse.cost = parseInt(newCourse.cost, 10) || 0;
    newCourse.intake = parseInt(newCourse.intake, 10) || 0;
    newCourse.cutoff = parseInt(newCourse.cutoff, 10) || 0;
    const userId = new ObjectId(newCourse.userId);
    const user = await usersCollection.findOne({ _id: userId });
    if (!user || !user.college) {
      return res.status(400).json({ success: false, message: 'Invalid user or missing college information' });
    }
    const coursesCount = await coursesCollection.countDocuments({});
    const newId = coursesCount + 1;
    newCourse.id = newId; 
    newCourse.college = user.college;
    newCourse.status = 'unverified';
    newCourse.count = 0; 
    await coursesCollection.insertOne(newCourse);
    res.status(200).json({ success: true, message: 'Course added successfully' });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ success: false, message: 'Error adding course' });
  }
});

app.get('/api/college-courses-sold', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const boughtCourses = await boughtCoursesCollection.find({ 'course.college': user.college }).toArray();
    res.status(200).json(boughtCourses);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses-admin', async (req, res) => {
  try {
    const courses = await coursesCollection.find().toArray();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching courses' });
  }
});
app.post('/api/courses-admin', async (req, res) => {
  try {
    const updatedCourses = req.body;
    await coursesCollection.deleteMany({});
    await coursesCollection.insertMany(updatedCourses);
    const branches = [...new Set(updatedCourses.map(course => course.branch))];
    const districts = [...new Set(updatedCourses.map(course => course.district))];
    const filters = { branches: branches.sort(), districts: districts.sort() };
    await filtersCollection.replaceOne({}, filters, { upsert: true });
    res.status(200).send('Courses updated successfully');
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating courses' });
  }
});
app.get('/api/purchases-admin', async (req, res) => {
  try {
    const purchases = await boughtCoursesCollection.find().toArray();
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching purchases' });
  }
});
app.get('/api/students', async (req, res) => {
  try {
    const students = await usersCollection.find({ type: 'student' }).toArray();
    res.json(students);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/college-users', async (req, res) => {
  try {
    const collegeUsers = await usersCollection.find({ type: "college" }).toArray();
    const collegeUserDetails = await Promise.all(collegeUsers.map(async (user) => {
      const courses = await coursesCollection.find({ college: user.college }).toArray();
      return { user, courses };
    }));
    res.status(200).json(collegeUserDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching college users and courses', error });
  }
});

app.get('/api/student-users', async (req, res) => {
  try {
    // Fetch all users who are students
    const studentUsers = await usersCollection.find({ type: "student" }).toArray();
    const studentUserDetails = await Promise.all(studentUsers.map(async (user) => {
      const purchases = await boughtCoursesCollection.find({ 'user._id': user._id }).toArray();
      return { user, purchases };
    }));
    res.status(200).json(studentUserDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student users and purchases', error });
  }
});

export default app;

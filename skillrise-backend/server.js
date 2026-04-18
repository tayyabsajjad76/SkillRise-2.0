require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const http = require('http');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const client = new MongoClient(process.env.MONGO_URI);
let usersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db('skillrise');
  usersCollection = db.collection('users');
  console.log('✅ MongoDB connected');
}

function getInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

async function handleSignup(req, res) {
  const { name, email, password } = await getBody(req);

  if (!name || name.trim().length < 2)
    return sendJSON(res, 400, { field: 'su-name', message: 'Name must be at least 2 characters' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return sendJSON(res, 400, { field: 'su-email', message: 'Enter a valid email address' });
  if (!password || password.length < 6)
    return sendJSON(res, 400, { field: 'su-password', message: 'Password must be at least 6 characters' });

  const exists = await usersCollection.findOne({ email: email.toLowerCase() });
  if (exists)
    return sendJSON(res, 409, { field: 'su-email', message: 'Email already registered. Please login.' });

  const hashed = await bcrypt.hash(password, 10);
  const initials = getInitials(name);
  const user = {
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashed,
    initials,
    joinedAt: new Date()
  };
  await usersCollection.insertOne(user);

  const token = jwt.sign(
    { name: user.name, email: user.email, initials },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  sendJSON(res, 201, {
    message: 'Account created!',
    token,
    user: { name: user.name, email: user.email, initials }
  });
}

async function handleLogin(req, res) {
  const { email, password } = await getBody(req);

  if (!email) return sendJSON(res, 400, { field: 'li-email', message: 'Enter your email' });
  if (!password) return sendJSON(res, 400, { field: 'li-password', message: 'Enter your password' });

  const user = await usersCollection.findOne({ email: email.toLowerCase() });
  if (!user) return sendJSON(res, 401, { field: 'li-email', message: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return sendJSON(res, 401, { field: 'li-password', message: 'Invalid email or password' });

  const token = jwt.sign(
    { name: user.name, email: user.email, initials: user.initials },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  sendJSON(res, 200, {
    message: 'Login successful!',
    token,
    user: { name: user.name, email: user.email, initials: user.initials }
  });
}

const server = http.createServer(async (req, res) => {

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  try {
    if (req.method === 'POST' && req.url === '/api/signup') return await handleSignup(req, res);
    if (req.method === 'POST' && req.url === '/api/login')  return await handleLogin(req, res);
    if (req.method === 'GET'  && req.url === '/api/users')  {
      const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
      return sendJSON(res, 200, users);
    }
    if (req.method === 'POST' && req.url === '/api/chat') {
      const { message } = await getBody(req);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(message);
      const reply = result.response.text();
      return sendJSON(res, 200, { reply });
    }
    sendJSON(res, 404, { message: 'Route not found' });
  }   catch (err) {
    console.error(err);
    sendJSON(res, 500, { message: err.message });
  }
});

connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});








// require("dotenv").config();
// const http = require("http");
// const { MongoClient } = require("mongodb");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const client = new MongoClient(process.env.MONGO_URI);
// let usersCollection;

// async function connectDB() {
//   await client.connect();
//   const db = client.db("skillrise");
//   usersCollection = db.collection("users");
//   console.log("✅ MongoDB connected");
// }

// function getInitials(name) {
//   return name
//     .trim()
//     .split(/\s+/)
//     .map((w) => w[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);
// }

// function sendJSON(res, statusCode, data) {
//   res.writeHead(statusCode, {
//     "Content-Type": "application/json",
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Headers": "Content-Type, Authorization",
//     "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//   });
//   res.end(JSON.stringify(data));
// }

// function getBody(req) {
//   return new Promise((resolve, reject) => {
//     let body = "";
//     req.on("data", (chunk) => (body += chunk.toString()));
//     req.on("end", () => {
//       try {
//         resolve(JSON.parse(body));
//       } catch {
//         reject(new Error("Invalid JSON"));
//       }
//     });
//   });
// }

// async function handleSignup(req, res) {
//   const { name, email, password } = await getBody(req);

//   if (!name || name.trim().length < 2)
//     return sendJSON(res, 400, {
//       field: "su-name",
//       message: "Name must be at least 2 characters",
//     });
//   if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
//     return sendJSON(res, 400, {
//       field: "su-email",
//       message: "Enter a valid email address",
//     });
//   if (!password || password.length < 6)
//     return sendJSON(res, 400, {
//       field: "su-password",
//       message: "Password must be at least 6 characters",
//     });

//   const exists = await usersCollection.findOne({ email: email.toLowerCase() });
//   if (exists)
//     return sendJSON(res, 409, {
//       field: "su-email",
//       message: "Email already registered. Please login.",
//     });

//   const hashed = await bcrypt.hash(password, 10);
//   const initials = getInitials(name);
//   const user = {
//     name: name.trim(),
//     email: email.toLowerCase(),
//     password: hashed,
//     initials,
//     joinedAt: new Date(),
//   };
//   await usersCollection.insertOne(user);

//   const token = jwt.sign(
//     { name: user.name, email: user.email, initials },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" },
//   );

//   sendJSON(res, 201, {
//     message: "Account created!",
//     token,
//     user: { name: user.name, email: user.email, initials },
//   });
// }

// async function handleLogin(req, res) {
//   const { email, password } = await getBody(req);

//   if (!email)
//     return sendJSON(res, 400, {
//       field: "li-email",
//       message: "Enter your email",
//     });
//   if (!password)
//     return sendJSON(res, 400, {
//       field: "li-password",
//       message: "Enter your password",
//     });

//   const user = await usersCollection.findOne({ email: email.toLowerCase() });
//   if (!user)
//     return sendJSON(res, 401, {
//       field: "li-email",
//       message: "Invalid email or password",
//     });

//   const match = await bcrypt.compare(password, user.password);
//   if (!match)
//     return sendJSON(res, 401, {
//       field: "li-password",
//       message: "Invalid email or password",
//     });

//   const token = jwt.sign(
//     { name: user.name, email: user.email, initials: user.initials },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" },
//   );

//   sendJSON(res, 200, {
//     message: "Login successful!",
//     token,
//     user: { name: user.name, email: user.email, initials: user.initials },
//   });
// }

// const server = http.createServer(async (req, res) => {
//   if (req.method === "OPTIONS") {
//     res.writeHead(204, {
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Headers": "Content-Type, Authorization",
//       "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//     });
//     return res.end();
//   }

//   try {
//     if (req.method === "POST" && req.url === "/api/signup")
//       return await handleSignup(req, res);
//     if (req.method === "POST" && req.url === "/api/login")
//       return await handleLogin(req, res);
//     if (req.method === "GET" && req.url === "/api/users") {
//       const users = await usersCollection
//         .find({}, { projection: { password: 0 } })
//         .toArray();
//       return sendJSON(res, 200, users);
//     }
//     if (req.method === "POST" && req.url === "/api/chat") {
//       const { message, history } = await getBody(req);

//       const response = await fetch(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             contents: [
//               {
//                 role: "user",
//                 parts: [
//                   {
//                     text: `You are SR-AI, an expert AI mentor for Skill Rise 2.0 platform. You help students with learning, career guidance, coding, and motivation. Be friendly, concise and helpful.\n\nStudent says: ${message}`,
//                   },
//                 ],
//               },
//             ],
//           }),
//         },
//       );

//       const data = await response.json();
//       const reply =
//         data.candidates?.[0]?.content?.parts?.[0]?.text ||
//         "Sorry, I could not process that.";
//       return sendJSON(res, 200, { reply });
//     }
//     sendJSON(res, 404, { message: "Route not found" }); // ← this line stays
//   } catch (err) {
//     console.error(err);
//     sendJSON(res, 500, { message: "Server error. Please try again." });
//   }
// });

// connectDB()
//   .then(() => {
//     const PORT = process.env.PORT || 3001;
//     server.listen(PORT, () =>
//       console.log(`🚀 Server running on http://localhost:${PORT}`),
//     );
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection failed:", err.message);
//   });

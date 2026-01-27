/**
 * 🪷 VANSH MOCK BACKEND SERVER
 * Simple Express.js API for development without database
 */

import cors from 'cors';
import express from 'express';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════

const mockUsers = [
  {
    id: '1',
    email: 'arjun@example.com',
    password: 'vansh123', // In real app, this would be hashed
    memberId: 'mem_001',
    familyId: 'fam_001',
    role: 'admin',
    firstName: 'Arjun',
    lastName: 'Sharma'
  }
];

const mockFamily = {
  id: 'fam_001',
  name: 'Sharma Family',
  surname: 'Sharma',
  motto: 'धर्मो रक्षति रक्षितः',
  createdAt: '2020-01-15'
};

const mockMembers = [
  {
    id: 'mem_001',
    firstName: 'Arjun',
    lastName: 'Sharma',
    gender: 'male',
    birthDate: '1985-03-15',
    birthPlace: 'Jaipur, Rajasthan',
    isAlive: true,
    occupation: 'Software Engineer',
    currentCity: 'Bangalore',
    bio: 'The tech-savvy grandson who started this digital family tree'
  },
  {
    id: 'mem_002',
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: 'female',
    birthDate: '1988-07-22',
    birthPlace: 'Delhi',
    isAlive: true,
    occupation: 'Doctor',
    currentCity: 'Bangalore',
    bio: 'Devoted wife and caring mother'
  },
  {
    id: 'mem_003',
    firstName: 'Vikram',
    lastName: 'Sharma',
    gender: 'male',
    birthDate: '1955-11-08',
    birthPlace: 'Jaipur, Rajasthan',
    isAlive: true,
    occupation: 'Retired Teacher',
    currentCity: 'Jaipur',
    bio: 'The patriarch who taught generations'
  },
  {
    id: 'mem_004',
    firstName: 'Kamala',
    lastName: 'Sharma',
    maidenName: 'Gupta',
    gender: 'female',
    birthDate: '1958-04-12',
    birthPlace: 'Udaipur, Rajasthan',
    isAlive: true,
    occupation: 'Homemaker',
    currentCity: 'Jaipur',
    bio: 'Keeper of family recipes and traditions'
  },
  {
    id: 'mem_005',
    firstName: 'Rajesh',
    lastName: 'Sharma',
    gender: 'male',
    birthDate: '1925-02-20',
    deathDate: '2015-09-10',
    birthPlace: 'Jodhpur, Rajasthan',
    isAlive: false,
    occupation: 'Freedom Fighter, Farmer',
    bio: 'Fought for independence, built the family legacy'
  }
];

const mockMemories = [
  {
    id: 'memory_001',
    title: 'Wedding Day - Arjun & Priya',
    description: 'A beautiful ceremony at the Jaipur palace',
    mediaType: 'image',
    mediaUrl: 'https://picsum.photos/800/600?random=1',
    createdAt: '2015-02-14',
    tags: ['wedding', 'celebration', 'family']
  },
  {
    id: 'memory_002',
    title: 'Diwali 2019',
    description: 'The whole family gathered for Diwali celebrations',
    mediaType: 'image',
    mediaUrl: 'https://picsum.photos/800/600?random=2',
    createdAt: '2019-10-27',
    tags: ['diwali', 'festival', 'celebration']
  },
  {
    id: 'memory_003',
    title: 'Grandpa\'s 90th Birthday',
    description: 'Celebrating Rajesh ji\'s milestone birthday',
    mediaType: 'image',
    mediaUrl: 'https://picsum.photos/800/600?random=3',
    createdAt: '2015-02-20',
    tags: ['birthday', 'milestone', 'grandfather']
  }
];

const mockKathas = [
  {
    id: 'katha_001',
    title: 'How Grandfather Came to Jaipur',
    description: 'The story of our family migration during partition',
    audioUrl: null,
    duration: 0,
    narrator: mockMembers[2],
    transcript: 'This is the story of how our family moved from Lahore to Jaipur during the partition of 1947...',
    createdAt: '2023-01-15'
  },
  {
    id: 'katha_002',
    title: 'The Family Recipe Secret',
    description: 'How grandmother\'s dal recipe has been passed down',
    audioUrl: null,
    duration: 0,
    narrator: mockMembers[3],
    transcript: 'My mother-in-law taught me this recipe on the third day of my marriage...',
    createdAt: '2023-03-20'
  }
];

const mockTraditions = [
  {
    id: 'tradition_001',
    name: 'Karva Chauth',
    description: 'Married women fast for their husbands\' longevity',
    category: 'Festival',
    frequency: 'Yearly',
    origin: 'Ancient Rajasthani tradition'
  },
  {
    id: 'tradition_002',
    name: 'Morning Puja',
    description: 'Daily morning prayers at the family temple',
    category: 'Spiritual',
    frequency: 'Daily',
    origin: 'Family practice since 1920s'
  }
];

// Generate simple JWT-like token
function generateToken(user: any): string {
  const payload = { userId: user.id, memberId: user.memberId, familyId: user.familyId };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Verify token
function verifyToken(token: string): any {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '🪷 Vansh Mock API is running',
    timestamp: new Date().toISOString() 
  });
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Login attempt:', email);
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    });
  }
  
  const token = generateToken(user);
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        memberId: user.memberId,
        familyId: user.familyId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, familyName, surname, memberName } = req.body;
  console.log('📝 Registration:', email, familyName);
  
  if (mockUsers.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
    });
  }
  
  const newUser = {
    id: `user_${Date.now()}`,
    email,
    password,
    memberId: `mem_${Date.now()}`,
    familyId: `fam_${Date.now()}`,
    role: 'admin',
    firstName: memberName.split(' ')[0],
    lastName: surname
  };
  
  mockUsers.push(newUser);
  
  const token = generateToken(newUser);
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        memberId: newUser.memberId,
        familyId: newUser.familyId,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
  
  const user = mockUsers.find(u => u.id === payload.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'User not found' } });
  }
  
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      memberId: user.memberId,
      familyId: user.familyId,
      role: user.role
    }
  });
});

// Family Routes
app.get('/api/families', (req, res) => {
  res.json({ success: true, data: mockFamily });
});

// Member Routes
app.get('/api/members', (req, res) => {
  res.json({ success: true, data: mockMembers });
});

app.get('/api/members/:id', (req, res) => {
  const member = mockMembers.find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, error: { message: 'Member not found' } });
  }
  res.json({ success: true, data: member });
});

// Memory Routes
app.get('/api/memories', (req, res) => {
  res.json({ success: true, data: mockMemories });
});

// Katha Routes
app.get('/api/kathas', (req, res) => {
  res.json({ success: true, data: mockKathas });
});

// Vasiyat Routes
app.get('/api/vasiyats', (req, res) => {
  res.json({ success: true, data: [] });
});

// Traditions (Parampara) Routes
app.get('/api/traditions', (req, res) => {
  res.json({ success: true, data: mockTraditions });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  console.log(`
  🪷 ═══════════════════════════════════════════════════════
     VANSH MOCK API SERVER
     Running on http://localhost:${PORT}
     
     📌 Demo Login: arjun@example.com / vansh123
     
     ✅ No database required - using mock data
  ═══════════════════════════════════════════════════════ 🪷
  `);
});

// Keep the server running
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

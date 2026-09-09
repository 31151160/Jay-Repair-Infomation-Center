// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (index.html, images, CSS, JS) from root directory
app.use(express.static(path.join(__dirname)));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase initialized successfully.');
} else {
  console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY missing in environment variables.');
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// GET /api/videos - Retrieve all video tutorials
app.get('/api/videos', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching videos:', err.message);
    res.status(500).json({ error: 'Failed to fetch video tutorials' });
  }
});

// POST /api/videos - Submit a new video tutorial
app.post('/api/videos', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not configured' });
  }

  const { title, category, duration, description, url, embedUrl } = req.body;

  if (!title || !category || !url) {
    return res.status(400).json({ error: 'Title, category, and URL are required.' });
  }

  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([{ title, category, duration, description, url, embedUrl }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: 'Video added successfully', data });
  } catch (err) {
    console.error('Error saving video:', err.message);
    res.status(500).json({ error: 'Failed to save video tutorial' });
  }
});

// GET /api/comments - Fetch comments for a specific video or topic
app.get('/api/comments', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not configured' });
  }

  const { video_id } = req.query;

  try {
    let query = supabase.from('comments').select('*').order('created_at', { ascending: false });
    if (video_id) {
      query = query.eq('video_id', video_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/comments - Add a new comment
app.post('/api/comments', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not configured' });
  }

  const { video_id, author_name, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        { 
          video_id: video_id || null, 
          author_name: author_name || 'Anonymous User', 
          content 
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json({ message: 'Comment submitted successfully', data });
  } catch (err) {
    console.error('Error posting comment:', err.message);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

// SPA Fallback Route - Route all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Web Server
app.listen(PORT, () => {
  console.log(`Jay Repair Info Center Server listening on port ${PORT}`);
});

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const morgan = require('morgan');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';
const redis = new Redis(REDIS_URL);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const uploadDir = path.resolve(__dirname,'storage','uploads');
const outputDir = path.resolve(__dirname,'storage','outputs');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, id + ext)
  }
})
const upload = multer({ storage: storage, limits: { fileSize: 15*1024*1024 } });

app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { prompt, duration='8', resolution='720', style='cinematic' } = req.body;
    if(!file) return res.status(400).json({ error: 'no image' });

    const id = path.parse(file.filename).name;
    const job = { id, filename: file.filename, prompt, duration: Number(duration), resolution, style, created_at: Date.now() };
    // push job into redis list
    await redis.lpush('jobs', JSON.stringify(job));
    await redis.hset(`job:${id}`, 'status', 'queued', 'job', JSON.stringify(job));
    res.json({ id, status: 'queued', download: `/download/${id}` });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/status/:id', async (req,res) => {
  const id = req.params.id;
  const info = await redis.hgetall(`job:${id}`);
  if(!info || Object.keys(info).length===0) return res.status(404).json({ error: 'not found' });
  let jobObj = {};
  try { jobObj = JSON.parse(info.job); } catch(e) { jobObj = {}; }
  res.json({ id, status: info.status || 'unknown', job: jobObj, output: info.output || null });
});

app.get('/download/:id', async (req,res) => {
  const id = req.params.id;
  const file = path.join(outputDir, id + '.mp4');
  if(fs.existsSync(file)) return res.sendFile(file);
  return res.status(404).json({ error: 'not ready' });
});

app.get('/health', (req,res)=> res.json({ok:true}));

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=> console.log('Backend listening on', PORT));

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// فولدر الفيديوهات
const uploadDir = './client/public/videos';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive:true});

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req,file,cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({storage});

// API رفع فيديو + Mine بلوك
app.post('/api/upload', upload.single('video'), (req,res) => {
  try {
    const videoFile = req.file.filename;
    const title = req.body.title || 'فيديو جديد';
    
    // اقرا البلوكتشين
    let chain = [];
    try { chain = JSON.parse(fs.readFileSync('./client/public/chain.json','utf8')); } catch(e){}
    
    // اعمل بلوك جديد للفيديو
    const newBlock = {
      index: chain.length,
      type: `VIDEO - ${videoFile}`,
      value: title,
      formula: `${title} = وحدة ${chain.length}/315`,
      label: title,
      fraction: `${chain.length}/315`,
      operation: `فيديو #${chain.length}`,
      time: new Date().toLocaleString('ar-EG'),
      hash: `EG-VIDEO-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      video: `/videos/${videoFile}`
    };
    
    chain.push(newBlock);
    fs.writeFileSync('./client/public/chain.json', JSON.stringify(chain,null,2));
    fs.writeFileSync('./public/chain.json', JSON.stringify(chain,null,2));
    
    console.log(`⛓️ بلوك جديد #${newBlock.index}: ${title}`);
    
    res.json({ 
      success: true, 
      block: newBlock,
      videoUrl: `/videos/${videoFile}`,
      message: `تم رفع ${title} وتوثيقه ببلوك #${newBlock.index}`
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

app.get('/api/chain', (req,res) => {
  const chain = JSON.parse(fs.readFileSync('./client/public/chain.json','utf8'));
  res.json(chain);
});

app.get('/api/videos', (req,res) => {
  const files = fs.readdirSync(uploadDir).map(f => ({url: `/videos/${f}`, name: f}));
  res.json(files);
});

app.listen(3001, '0.0.0.0', () => {
  console.log('✅ EG Server شغال على http://localhost:3001');
  console.log('📹 رفع الفيديو: POST /api/upload');
  console.log('⛓️ البلوكتشين: GET /api/chain');
});

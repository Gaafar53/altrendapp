const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = './client/public/videos';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, {recursive:true});

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req,file,cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({storage});

app.post('/api/upload', upload.single('video'), (req,res) => {
  try {
    const videoFile = req.file ? req.file.filename : 'no-file';
    const title = req.body.title || 'فيديو جديد';
    const chainPath = './client/public/chain.json';
    let chain = [];
    try { chain = JSON.parse(fs.readFileSync(chainPath,'utf8')); } catch(e){ chain = []; }
    
    const newBlock = {
      index: chain.length,
      type: `VIDEO - ${title}`,
      value: title,
      formula: `${title} = وحدة ${chain.length}/315`,
      label: title,
      fraction: `${chain.length}/315`,
      time: new Date().toLocaleString('ar-EG'),
      hash: `EG-VIDEO-${Date.now()}`,
      video: `/videos/${videoFile}`
    };
    
    chain.push(newBlock);
    fs.writeFileSync(chainPath, JSON.stringify(chain,null,2));
    fs.writeFileSync('./public/chain.json', JSON.stringify(chain,null,2));
    
    console.log(`⛓️ بلوك جديد #${newBlock.index}: ${title}`);
    res.json({ success: true, block: newBlock, videoUrl: `/videos/${videoFile}` });
  } catch(err) {
    console.error(err);
    res.status(500).json({error: err.message});
  }
});

app.get('/api/chain', (req,res) => {
  const chain = JSON.parse(fs.readFileSync('./client/public/chain.json','utf8'));
  res.json(chain);
});

app.listen(3001, '0.0.0.0', () => {
  console.log('✅ EG Server شغال على http://localhost:3001');
});

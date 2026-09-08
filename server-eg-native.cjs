const http=require('http'),fs=require('fs'),path=require('path');
const PORT=3001; const pub='./client/public'; const up=path.join(pub,'videos');
if(!fs.existsSync(up))fs.mkdirSync(up,{recursive:true});
let CC,BM; try{CC=require('./services/CountryBlockchainService.cjs')}catch(e){console.log('CC error',e); CC={getAllKeys:()=>['EG'],getReadableFeed:()=>[],getAllFeed:()=>[],getProfile:()=>({myName:'انا',btName:'Node'}),setMyProfile:()=>({}),likePost:()=>({}),getFriends:()=>({}),followViaBluetooth:()=>({})}}
try{BM=require('./services/BluetoothMeshService.cjs')}catch(e){BM={getNearbyDevices:()=>[],addRealDevice:()=>({}),connectDevice:()=>({})}}
const chatFile=path.join(__dirname,'data-country','chat.json'); if(!fs.existsSync(path.dirname(chatFile)))fs.mkdirSync(path.dirname(chatFile),{recursive:true}); if(!fs.existsSync(chatFile))fs.writeFileSync(chatFile,'[]');
function getChat(){try{return JSON.parse(fs.readFileSync(chatFile))}catch(e){return[]}} function addChat(m){let c=getChat();c.push({id:Date.now(),...m,time:new Date().toLocaleString('ar-EG')});fs.writeFileSync(chatFile,JSON.stringify(c.slice(-200),null,2));}
function cors(r){r.setHeader('Access-Control-Allow-Origin','*');r.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');r.setHeader('Access-Control-Allow-Headers','*');}
function parseMP(buf,b){let parts=[];let sep='--'+b;let s=buf.indexOf(sep);while(s!==-1){let e=buf.indexOf(sep,s+sep.length);if(e===-1)break;let part=buf.slice(s+sep.length,e);let he=part.indexOf('\r\n\r\n');if(he!==-1)parts.push({header:part.slice(0,he).toString(),body:part.slice(he+4,part.length-2)});s=e;}return parts;}
const srv=http.createServer((req,res)=>{
cors(res); if(req.method==='OPTIONS'){res.writeHead(200);return res.end();}
if(req.url==='/api/profile'){if(req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(CC.getProfile()));}else{let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{let {myName,btName}=JSON.parse(b);let p=CC.setMyProfile(myName,btName);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(p));}catch(e){res.writeHead(400);res.end('{}')}});return;}}
if(req.url==='/api/country/keys'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(CC.getAllKeys()));}
if(req.url==='/api/country/feed'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(CC.getReadableFeed()));}
if(req.url==='/api/public/feed'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(CC.getAllFeed().filter(p=>!p.isPrivate).reverse().slice(0,80)));}
if(req.url==='/api/my/feed'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(CC.getAllFeed().filter(p=>p.isPrivate).reverse()));}
if(req.url==='/api/chat/feed'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(getChat().reverse().slice(0,80)));}
if(req.url==='/api/friends'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(CC.getFriends()));}
if(req.url.startsWith('/api/country/like/')&&req.method==='POST'){let id=req.url.split('/').pop();let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{let {user}=JSON.parse(b);let p=CC.likePost(id,user||'انا');res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(p));}catch(e){res.writeHead(400);res.end('{}')}});return;}
if(req.url==='/api/follow'&&req.method==='POST'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{let {id,name,btName}=JSON.parse(b);let f=CC.followViaBluetooth(id,name,btName);BM.connectDevice(id);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(f));}catch(e){res.writeHead(400);res.end('{}')}});return;}
if(req.url==='/api/country/scan'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(BM.getNearbyDevices()));}
if(req.url==='/api/country/scan-real'&&req.method==='POST'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{let {name,btName,id}=JSON.parse(b);let node=BM.addRealDevice(name,id,btName);CC.addRemoteProfile(id,name,btName);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(node));}catch(e){res.writeHead(400);res.end('{}')}});return;}
if(req.url==='/api/country/post'&&req.method==='POST'){
let ct=req.headers['content-type']||''; if(ct.includes('multipart')){let ch=[];req.on('data',c=>ch.push(c));req.on('end',()=>{try{let buf=Buffer.concat(ch);let bd=ct.split('boundary=')[1];let parts=parseMP(buf,bd);let txt='',cc='EG',priv=false,vid=null;parts.forEach(p=>{if(p.header.includes('name="text"'))txt=p.body.toString().trim();if(p.header.includes('name="country"'))cc=p.body.toString().trim();if(p.header.includes('name="isPrivate"'))priv=p.body.toString().trim()==='true';if(p.header.includes('name="video"')&&p.body.length>100){let fn=Date.now()+'-'+(p.header.match(/filename="([^"]+)"/)?.[1]||'v.mp4').replace(/[^a-z0-9._-]/gi,'_');fs.writeFileSync(path.join(up,fn),p.body);vid='/videos/'+fn;}});let b=CC.createPost(txt,cc,null,vid,priv);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(b));}catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}))}});return;}
}
if(req.url==='/api/chat/send'&&req.method==='POST'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{let {text,author}=JSON.parse(b);addChat({text,author:author||'انا'});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true}));}catch(e){res.writeHead(400);res.end('{}')}});return;}
let map={'/':'/index.html','/country':'/country.html','/my':'/my.html','/public':'/public.html','/chat':'/chat.html'};
let p=req.url.split('?')[0]; if(map[p])p=map[p]; let fp=path.join(pub,p);
if(fs.existsSync(fp)&&!fs.statSync(fp).isDirectory()){let ext=path.extname(fp);let mime=ext=='.html'?'text/html; charset=utf-8':ext=='.mp4'?'video/mp4':'text/plain';res.writeHead(200,{'Content-Type':mime});return fs.createReadStream(fp).pipe(res);}
if(req.url.startsWith('/videos/')){let f=path.join(pub,req.url); if(fs.existsSync(f)){res.writeHead(200,{'Content-Type':'video/mp4'});return fs.createReadStream(f).pipe(res);}}
res.writeHead(404);res.end('not found');
});
srv.listen(PORT,'0.0.0.0',()=>console.log(`✅ هندسي احترافي: بدون ريفرش + اسم بلوتوث حقيقي + إعجاب + متابعة بلوتوث + أصدقاء http://localhost:${PORT}/country`));

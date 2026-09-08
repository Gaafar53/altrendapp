const fs=require('fs'),path=require('path');
const D=path.join(__dirname,'../data-country');
const CF=path.join(D,'chain-country.json');
const KF=path.join(D,'my-keys.json');
const LF=path.join(D,'likes.json');
const FF=path.join(D,'friends.json');
const PF=path.join(D,'profiles.json');
[CF,KF,LF,FF,PF].forEach(f=>{if(!fs.existsSync(path.dirname(f)))fs.mkdirSync(path.dirname(f),{recursive:true})});
if(!fs.existsSync(KF))fs.writeFileSync(KF,JSON.stringify(['EG']));
if(!fs.existsSync(CF))fs.writeFileSync(CF,JSON.stringify([]));
if(!fs.existsSync(LF))fs.writeFileSync(LF,JSON.stringify({}));
if(!fs.existsSync(FF))fs.writeFileSync(FF,JSON.stringify({following:[],followers:[],friends:[]}));
if(!fs.existsSync(PF))fs.writeFileSync(PF,JSON.stringify({myName:'انا',btName:'Mesh-Node-'+Math.floor(Math.random()*9000),profiles:{}}));

class CB{
  _read(f,def){try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){return def}}
  _write(f,d){fs.writeFileSync(f,JSON.stringify(d,null,2))}
  getAllKeys(){return this._read(KF,['EG'])}
  addCountryKey(c){let k=this.getAllKeys();if(!k.includes(c)){k.push(c);this._write(KF,k)}return k}
  getAllFeed(){return this._read(CF,[])}
  getReadableFeed(){return this.getAllFeed().slice().reverse()}
  getProfile(){return this._read(PF,{myName:'انا',btName:'Mesh-Node',profiles:{}})}
  setMyProfile(myName,btName){let p=this.getProfile();p.myName=myName||p.myName;p.btName=btName||p.btName;this._write(PF,p);return p}
  addRemoteProfile(id,name,btName,keys){let p=this.getProfile();p.profiles[id]={id,name,btName:btName||name,keys:keys||['EG'],lastSeen:Date.now()};this._write(PF,p);return p}
  createPost(t,c,a,v,priv){let ch=this.getAllFeed();let prof=this.getProfile();let b={index:ch.length,id:Date.now(),country:c,text:t,author:a||prof.myName,btName:prof.btName,authorId:'me',video:v||null,image:null,isPrivate:!!priv,likes:0,likedBy:[],time:new Date().toLocaleString('ar-EG'),hash:`EG-${c}-${Date.now().toString(36)}`};ch.push(b);this._write(CF,ch);return b;}
  likePost(postId,userName){let ch=this.getAllFeed();let idx=ch.findIndex(p=>p.id==postId||p.index==postId);if(idx===-1)return null;let likes=this._read(LF,{});let key=String(ch[idx].id);if(!likes[key])likes[key]=[];if(likes[key].includes(userName)){likes[key]=likes[key].filter(u=>u!==userName);ch[idx].likes=Math.max(0,(ch[idx].likes||1)-1);ch[idx].likedBy=ch[idx].likedBy.filter(u=>u!==userName)}else{likes[key].push(userName);ch[idx].likes=(ch[idx].likes||0)+1;ch[idx].likedBy=[...new Set([...(ch[idx].likedBy||[]),userName])]}this._write(LF,likes);this._write(CF,ch);return ch[idx];}
  getFriends(){return this._read(FF,{following:[],followers:[],friends:[]})}
  followViaBluetooth(remoteId,remoteName,btName){let f=this.getFriends();let p=this.getProfile();if(!f.following.find(x=>x.id==remoteId)){f.following.push({id:remoteId,name:remoteName,btName,via:'bluetooth',time:Date.now()})}if(!f.friends.find(x=>x.id==remoteId)){f.friends.push({id:remoteId,name:remoteName,btName,mutual:false,time:Date.now()})}this._write(FF,f);this.addRemoteProfile(remoteId,remoteName,btName);return f;}
  unfollow(id){let f=this.getFriends();f.following=f.following.filter(x=>x.id!==id);f.friends=f.friends.filter(x=>x.id!==id);this._write(FF,f);return f;}
}
module.exports=new CB();

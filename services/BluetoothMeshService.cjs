const fs=require('fs'),path=require('path');
class Mesh{
  constructor(){
    this.file=path.join(__dirname,'../data-country','mesh-nodes.json');
    try{this.nodes=JSON.parse(fs.readFileSync(this.file,'utf8'))}catch(e){
      this.nodes=[
        {id:'node-me',name:'أنت',btName:'Mesh-Node-Me',keys:['EG'],rssi:-20,connected:true,real:true,likes:0,followers:0},
      ];
      this.save();
    }
  }
  save(){try{fs.writeFileSync(this.file,JSON.stringify(this.nodes,null,2))}catch(e){}}
  getNearbyDevices(){return this.nodes}
  addRealDevice(name,id,btName){
    let existing=this.nodes.find(n=>n.id==id);
    if(existing){existing.name=name;existing.btName=btName||name;existing.lastSeen=Date.now();existing.connected=true;this.save();return existing}
    let node={id:id||'real-'+Date.now(),name:name||'جهاز حقيقي',btName:btName||name,keys:['EG'],rssi:-30+Math.floor(Math.random()*-30),connected:true,real:true,lastSeen:Date.now(),likes:0,followers:0};
    this.nodes.push(node);this.save();return node;
  }
  connectDevice(id){let d=this.nodes.find(x=>x.id==id);if(d){d.connected=true;d.lastSeen=Date.now();this.save()}return d}
}
module.exports=new Mesh();

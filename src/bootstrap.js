(()=>{
'use strict';
const key='second-nature-proto-v1';
try{
 const raw=localStorage.getItem(key);
 if(!raw){
  const demo={id:'first',goal:'Focus',cueType:'Scent',cue:'Coffee aroma',response:'Begin focused work for two minutes',count:0,history:[],created:Date.now(),mode:1};
  localStorage.setItem(key,JSON.stringify({active:'first',items:[demo],reduced:false}));
 }
}catch(e){}
})();
import assert from 'node:assert/strict';
import {classify,shapeDistance,dtw} from '../recognition.mjs';
const pose=Array.from({length:21},(_,i)=>({x:.5+(i%4)*.02,y:.6-i*.01,z:0}));
const samples=Object.fromEntries(Array.from({length:26},(_,k)=>[String.fromCharCode(65+k),Array.from({length:1200},(_,j)=>Array.from({length:60},(_,i)=>Math.sin(i+j+k)*.5))]));
const start=performance.now();for(let i=0;i<10;i++)classify(pose,samples);console.log(`Large static corpus: ${((performance.now()-start)/10).toFixed(1)} ms/frame (26 × 1200 samples, includes initial cache fill).`);
assert.equal(shapeDistance(Array(60).fill(0),Array(60).fill(0)),0);
assert.equal(dtw(Array.from({length:24},()=>Array(62).fill(.2)),Array.from({length:24},()=>Array(62).fill(.2))),0);

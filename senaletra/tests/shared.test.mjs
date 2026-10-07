import assert from 'node:assert/strict';
import {shareExample,loadShared,compactFrames} from '../shared.mjs';
const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});if(options.method==='POST')return {ok:true,status:204};return {ok:true,status:200,json:async()=>[]};};
const values=Array.from({length:50},(_,i)=>Array(60).fill(i/100));assert.equal(compactFrames(values).length,24);
const one=await shareExample('C','static',values),two=await shareExample('C','static',values);assert.equal(one,two);assert.equal(JSON.parse(calls[0].options.body).values.length,24);
await loadShared('J');assert.equal(calls.length,4);assert.ok(calls[2].url.includes('mode=eq.static'));assert.ok(calls[3].url.includes('mode=eq.motion'));
globalThis.fetch=async()=>({ok:false,status:503});await assert.rejects(()=>shareExample('C','static',values),/503/);
globalThis.fetch=async()=>({ok:false,status:409});await shareExample('C','static',values);
console.log('Shared API tests passed: compact captures, repeat-safe IDs, both modes, error handling and duplicate retry.');

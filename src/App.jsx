import React, { useState, useCallback, useEffect, useRef } from 'react';

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────

function injectCSS() {
  if (document.getElementById('toneai-css')) return;
  const s = document.createElement('style');
  s.id = 'toneai-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1A0F07; color: #F2E8D5; font-family: Georgia, serif; overflow-x: hidden; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
    @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.02); } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes wa { from { height:4px; } to { height:var(--wh,20px); } }
    @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#1A0F07; } ::-webkit-scrollbar-thumb { background:#4A2E14; border-radius:3px; }
    button { cursor:pointer; border:none; background:none; font-family:inherit; }
    input { font-family:inherit; }
  `;
  document.head.appendChild(s);
}
injectCSS();

// ─── PALETTE ──────────────────────────────────────────────────────────────────

const T = {
  bg:'#1A0F07', surface:'#221208', raised:'#2E1A0A', border:'#4A2E14',
  amber:'#F5A623', orange:'#E8621A', cream:'#F2E8D5', muted:'#8A6A4A',
  vinyl:'#3D2010', gold:'#D4A017', green:'#4CAF7A',
};

// ─── RIG CATALOG ──────────────────────────────────────────────────────────────

const RIG = {
  guitarTypes: [
    { id:'strat',    label:'Stratocaster',    icon:'🎸', desc:'Bright, quacky single coils' },
    { id:'les_paul', label:'Les Paul',         icon:'🎸', desc:'Warm, thick humbuckers' },
    { id:'tele',     label:'Telecaster',       icon:'🎸', desc:'Twangy, punchy character' },
    { id:'sg',       label:'SG',               icon:'🎸', desc:'Aggressive, resonant' },
    { id:'semi',     label:'Semi-Hollow',      icon:'🎸', desc:'Warm, feedback-prone' },
    { id:'acoustic', label:'Acoustic/Electric',icon:'🎸', desc:'Natural, resonant' },
    { id:'rg',       label:'Ibanez RG',        icon:'🎸', desc:'Fast neck, modern shred' },
    { id:'prs',      label:'PRS',              icon:'🎸', desc:'Versatile, balanced tone' },
  ],
  pickupTypes: [
    { id:'single',    label:'Single Coil',  desc:'Bright, clear, vintage bite' },
    { id:'humbucker', label:'Humbucker',    desc:'Full, warm, hum-free' },
    { id:'p90',       label:'P-90',         desc:'Between single and humbucker' },
    { id:'active',    label:'Active (EMG)', desc:'High output, tight low end' },
    { id:'piezo',     label:'Piezo',        desc:'Acoustic simulation' },
  ],
  ampTypes: [
    { id:'tube',       label:'Tube Amp',       desc:'Dynamic, warm, natural compression' },
    { id:'solid',      label:'Solid State',    desc:'Clean, reliable, consistent' },
    { id:'modelling',  label:'Modelling Amp',  desc:'Versatile, digital, multi-voicing' },
    { id:'acoustic_a', label:'Acoustic Amp',   desc:'Flat response, natural' },
  ],
  ampBrands: [
    { id:'marshall', label:'Marshall',      models:['JCM 800','JCM 900','DSL40','DSL100','Origin 20','Plexi'] },
    { id:'fender',   label:'Fender',        models:['Twin Reverb','Deluxe Reverb','Blues Junior','Super Reverb','Princeton'] },
    { id:'mesa',     label:'Mesa/Boogie',   models:['Dual Rectifier','Mark IV','Mark V','Lone Star','Fillmore'] },
    { id:'vox',      label:'Vox',           models:['AC30','AC15','Night Train','MV50'] },
    { id:'orange',   label:'Orange',        models:['Rockerverb 50','TH30','AD30','Crush 35'] },
    { id:'peavey',   label:'Peavey',        models:['5150','6505','Classic 30','Windsor'] },
    { id:'boss',     label:'Boss (Katana)', models:['Katana 50','Katana 100','Katana Air','Nextone'] },
    { id:'laney',    label:'Laney',         models:['IronHeart 60','VC15','Cub 12R','LX120R'] },
  ],
  cabinets: [
    { id:'4x12_v30',  label:'4×12 V30',       desc:'British crunch, mid-focused' },
    { id:'4x12_gb',   label:'4×12 Greenback',  desc:'Warm, vintage British' },
    { id:'2x12_c90',  label:'2×12 Creamback',  desc:'Articulate, balanced' },
    { id:'1x12',      label:'1×12 Combo',       desc:'Portable, intimate' },
    { id:'open_back', label:'Open-Back Combo',  desc:'Airy, ambient spread' },
    { id:'closed',    label:'Closed-Back Cab',  desc:'Tight, focused low end' },
    { id:'direct',    label:'Direct / IR',      desc:'Studio direct, impulse response' },
  ],
  effects: [
    { id:'ts808',      label:'Ibanez TS-808',   type:'drive',  color:'#4CAF7A' },
    { id:'bd2',        label:'Boss BD-2',        type:'drive',  color:'#4CAF7A' },
    { id:'rat',        label:'ProCo RAT',        type:'drive',  color:'#4CAF7A' },
    { id:'klon',       label:'Klon Centaur',     type:'drive',  color:'#4CAF7A' },
    { id:'ds1',        label:'Boss DS-1',        type:'drive',  color:'#4CAF7A' },
    { id:'bigmuff',    label:'Big Muff Pi',      type:'fuzz',   color:'#E8621A' },
    { id:'compressor', label:'Compressor',       type:'comp',   color:'#F5A623' },
    { id:'ce2',        label:'Boss CE-2 Chorus', type:'mod',    color:'#4A90D9' },
    { id:'chorus',     label:'Chorus',           type:'mod',    color:'#4A90D9' },
    { id:'phaser',     label:'MXR Phase 90',     type:'mod',    color:'#E8621A' },
    { id:'flanger',    label:'Flanger',          type:'mod',    color:'#9B59B6' },
    { id:'tremolo',    label:'Tremolo',          type:'mod',    color:'#9B59B6' },
    { id:'dd7',        label:'Boss DD-7 Delay',  type:'delay',  color:'#E8621A' },
    { id:'dd3',        label:'Boss DD-3 Delay',  type:'delay',  color:'#E8621A' },
    { id:'tape_delay', label:'Tape Delay',       type:'delay',  color:'#E8621A' },
    { id:'bluesky',    label:'Strymon BlueSky',  type:'reverb', color:'#4A90D9' },
    { id:'hall',       label:'Hall Reverb',      type:'reverb', color:'#4A90D9' },
    { id:'spring',     label:'Spring Reverb',    type:'reverb', color:'#4A90D9' },
    { id:'wah',        label:'Cry Baby Wah',     type:'wah',    color:'#D4A017' },
    { id:'volume',     label:'Volume Pedal',     type:'vol',    color:'#8A6A4A' },
    { id:'looper',     label:'Looper',           type:'util',   color:'#8A6A4A' },
    { id:'tuner',      label:'Tuner Pedal',      type:'util',   color:'#8A6A4A' },
  ],
  effectGroups: [
    { label:'Drive & Fuzz',   types:['drive','fuzz'] },
    { label:'Compression',    types:['comp'] },
    { label:'Modulation',     types:['mod'] },
    { label:'Delay',          types:['delay'] },
    { label:'Reverb',         types:['reverb'] },
    { label:'Wah & Utility',  types:['wah','vol','util'] },
  ],
};

// ─── SONGS ────────────────────────────────────────────────────────────────────

const SONGS = [
  { id:1,  title:'Bulleya',              artist:'Parikrama',              genre:'Indian Rock',       bpm:132, key:'Em',  tuning:'Standard', match:91, color:'#C0392B', ytId:'HF8Bqv7H8Fc',    spotifyId:'',
    idealGear:{ guitars:['sg','les_paul'], pickups:['humbucker'], amps:['marshall','mesa'], models:['JCM 800','Dual Rectifier'], cabs:['4x12_v30','4x12_gb'], fx:['ts808','dd7','hall'] } },
  { id:2,  title:'But It Rained',        artist:'Parikrama',              genre:'Indian Rock',       bpm:96,  key:'Am',  tuning:'Standard', match:88, color:'#2980B9', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['strat','les_paul'], pickups:['single','humbucker'], amps:['marshall','vox'], models:['DSL40','AC30'], cabs:['4x12_v30','open_back'], fx:['ts808','bluesky','chorus'] } },
  { id:3,  title:'Dhoop',                artist:'Agnee',                  genre:'Indian Rock',       bpm:118, key:'F#m', tuning:'Standard', match:86, color:'#E67E22', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['les_paul','sg'], pickups:['humbucker'], amps:['marshall','orange'], models:['JCM 900','Rockerverb 50'], cabs:['4x12_v30'], fx:['ts808','phaser','dd7'] } },
  { id:4,  title:'Maahi Ve',             artist:'Agnee',                  genre:'Indian Rock',       bpm:78,  key:'Dm',  tuning:'Standard', match:83, color:'#8E44AD', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['strat','tele'], pickups:['single'], amps:['fender','vox'], models:['Twin Reverb','AC30'], cabs:['open_back','2x12_c90'], fx:['compressor','bluesky','dd3'] } },
  { id:5,  title:'Bus Conductor',        artist:'Thermal & a Quarter',    genre:'Indian Rock',       bpm:108, key:'G',   tuning:'Standard', match:90, color:'#27AE60', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['tele','strat'], pickups:['single'], amps:['fender','vox'], models:['Deluxe Reverb','AC15'], cabs:['open_back','1x12'], fx:['compressor','ts808','spring'] } },
  { id:6,  title:'Take the Lead',        artist:'Thermal & a Quarter',    genre:'Indian Rock',       bpm:120, key:'A',   tuning:'Standard', match:87, color:'#16A085', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['tele','strat'], pickups:['single'], amps:['fender'], models:['Twin Reverb','Blues Junior'], cabs:['open_back'], fx:['compressor','dd7','bluesky'] } },
  { id:7,  title:'Khwaja Mere Khwaja',   artist:'A.R. Rahman',            genre:'Indie Fusion',      bpm:92,  key:'Bb',  tuning:'Standard', match:89, color:'#D35400', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','semi'], pickups:['piezo','single'], amps:['fender','boss'], models:['Deluxe Reverb','Katana 100'], cabs:['open_back','direct'], fx:['chorus','hall','compressor'] } },
  { id:8,  title:'Dil Se Re',            artist:'A.R. Rahman',            genre:'Indie Fusion',      bpm:124, key:'C#m', tuning:'Standard', match:85, color:'#C0392B', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','strat'], pickups:['piezo','single'], amps:['fender','boss'], models:['Twin Reverb','Katana 50'], cabs:['open_back','direct'], fx:['chorus','tape_delay','bluesky'] } },
  { id:9,  title:'Rock On!!',            artist:'Shankar Ehsaan Loy',     genre:'Indie Fusion',      bpm:138, key:'E',   tuning:'Standard', match:93, color:'#E74C3C', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['les_paul','sg'], pickups:['humbucker'], amps:['marshall','mesa'], models:['JCM 800','Dual Rectifier'], cabs:['4x12_v30'], fx:['ts808','wah','dd7','hall'] } },
  { id:10, title:'Dil Chahta Hai',       artist:'Shankar Ehsaan Loy',     genre:'Indie Fusion',      bpm:100, key:'G',   tuning:'Standard', match:82, color:'#2980B9', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['strat','tele'], pickups:['single'], amps:['fender','vox'], models:['Twin Reverb','AC30'], cabs:['open_back'], fx:['chorus','compressor','spring'] } },
  { id:11, title:'Saiyaan',              artist:'Kailash Kher',           genre:'Indie Fusion',      bpm:88,  key:'Am',  tuning:'Standard', match:84, color:'#8E44AD', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','semi'], pickups:['piezo','p90'], amps:['fender','vox'], models:['Deluxe Reverb','AC15'], cabs:['open_back'], fx:['compressor','chorus','hall'] } },
  { id:12, title:'Jai Ho',               artist:'A.R. Rahman',            genre:'Indie Fusion',      bpm:135, key:'Dm',  tuning:'Standard', match:88, color:'#F39C12', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['strat','prs'], pickups:['single','humbucker'], amps:['mesa','boss'], models:['Mark V','Katana 100'], cabs:['4x12_v30','direct'], fx:['compressor','ts808','bluesky'] } },
  { id:13, title:'Tum Hi Ho',            artist:'Arijit Singh',           genre:'Bollywood Modern',  bpm:72,  key:'Ab',  tuning:'Standard', match:80, color:'#1ABC9C', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','strat'], pickups:['piezo','single'], amps:['fender','boss'], models:['Deluxe Reverb','Katana 50'], cabs:['open_back','direct'], fx:['compressor','bluesky','chorus'] } },
  { id:14, title:'Phir Le Aya Dil',      artist:'Arijit Singh',           genre:'Bollywood Modern',  bpm:68,  key:'F',   tuning:'Standard', match:77, color:'#E8621A', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','semi'], pickups:['piezo','single'], amps:['fender'], models:['Blues Junior','Princeton'], cabs:['open_back','direct'], fx:['compressor','spring','tape_delay'] } },
  { id:15, title:'Naina',                artist:'Amit Mishra',            genre:'Bollywood Modern',  bpm:84,  key:'Gm',  tuning:'Standard', match:79, color:'#9B59B6', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['strat','acoustic'], pickups:['single','piezo'], amps:['fender','vox'], models:['Deluxe Reverb','AC15'], cabs:['open_back'], fx:['compressor','chorus','bluesky'] } },
  { id:16, title:'Tadap Tadap',          artist:'KK',                     genre:'Bollywood Classic', bpm:80,  key:'Eb',  tuning:'Standard', match:81, color:'#C0392B', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','semi'], pickups:['piezo','p90'], amps:['fender','vox'], models:['Twin Reverb','AC30'], cabs:['open_back'], fx:['chorus','hall','compressor'] } },
  { id:17, title:'Piya Tose Naina',      artist:'Udit Narayan',           genre:'Bollywood Classic', bpm:76,  key:'C',   tuning:'Standard', match:78, color:'#2ECC71', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','semi'], pickups:['piezo','single'], amps:['fender'], models:['Deluxe Reverb','Princeton'], cabs:['open_back','direct'], fx:['compressor','spring','chorus'] } },
  { id:18, title:'Lotus Feet',           artist:'John McLaughlin & Shakti',genre:'Carnatic Fusion',  bpm:162, key:'B',   tuning:'Open G',   match:95, color:'#D4A017', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','prs'], pickups:['piezo','single'], amps:['fender','acoustic_a'], models:['Twin Reverb'], cabs:['open_back','direct'], fx:['compressor','chorus','bluesky'] } },
  { id:19, title:'Nadopasana',           artist:'Mandolin U. Shrinivas',  genre:'Carnatic Fusion',   bpm:148, key:'D#',  tuning:'Standard', match:97, color:'#8E44AD', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['acoustic','prs','semi'], pickups:['piezo','single'], amps:['fender','acoustic_a'], models:['Twin Reverb','Deluxe Reverb'], cabs:['open_back','direct'], fx:['compressor','chorus','spring'] } },
  { id:20, title:'Infinite Vision',      artist:'Prasanna',               genre:'Carnatic Fusion',   bpm:140, key:'A#',  tuning:'Drop D',   match:94, color:'#3498DB', ytId:'',               spotifyId:'',
    idealGear:{ guitars:['strat','prs','rg'], pickups:['single','humbucker'], amps:['fender','mesa'], models:['Twin Reverb','Mark V'], cabs:['open_back','2x12_c90'], fx:['compressor','ts808','dd7','bluesky'] } },
];

const GENRES = ['All','Indian Rock','Indie Fusion','Bollywood Modern','Bollywood Classic','Carnatic Fusion'];

const ARTIST_PATCHES = [
  { id:'jm',  name:'John Mayer',    genre:'Blues/Pop Rock',    vibe:'Clean Strat through Dumble, glassy and musical.',    amp:'Fender-style clean, light break-up',        chain:['COMP','AMP','CHORUS','DELAY','REVERB'], gain:3.5, bass:6, middle:7, treble:6.5, presence:5.5, master:7 },
  { id:'dg',  name:'David Gilmour', genre:'Progressive Rock',  vibe:'Singing sustain, creamy leads through Hi-Watt stack.',amp:'Clean base, colossus fuzz for leads',       chain:['COMP','FUZZ','AMP','CHORUS','DELAY','REVERB'], gain:6, bass:6.5, middle:5.5, treble:6, presence:6, master:7.5 },
  { id:'slash',name:'Slash',        genre:'Hard Rock',         vibe:'Les Paul into Marshall, creamy neck pickup crunch.',  amp:'JCM 800 cranked, neck pickup, slight cut',  chain:['DRIVE','AMP','DELAY','REVERB'], gain:7.5, bass:7, middle:6, treble:5.5, presence:7, master:8 },
  { id:'sry', name:'Santana',       genre:'Latin Rock',        vibe:'Singing sustain, woman tone, Mesa Mark series.',      amp:'Mesa Mark clean/crunch, modded',            chain:['COMP','DRIVE','AMP','CHORUS','DELAY','REVERB'], gain:6.5, bass:6, middle:8, treble:5, presence:6, master:7 },
  { id:'srv', name:'Stevie Ray',    genre:'Texas Blues',       vibe:'Strat into Dumble/Vibroverb, fierce and expressive.', amp:'Fender Vibroverb cranked, spring reverb',  chain:['COMP','DRIVE','AMP','REVERB'], gain:7, bass:7.5, middle:6.5, treble:6, presence:5.5, master:8 },
];

const PEDAL_CLR = {
  COMP:'#F5A623', DRIVE:'#4CAF7A', AMP:'#E8621A',
  DELAY:'#E8621A', REVERB:'#4A90D9', WAH:'#D4A017',
  CHORUS:'#4A90D9', PHASE:'#9B59B6', FUZZ:'#E8621A',
};

const EMPTY_RIG = { guitarType:'', pickup:'', ampType:'', ampBrand:'', ampModel:'', cab:'', effects:[] };

// ─── SCORING ──────────────────────────────────────────────────────────────────

function calcRigMatch(song, rig) {
  if (!rig || (!rig.guitarType && !rig.ampBrand)) return null;
  const g = song.idealGear || {};
  let sc = 0, tot = 0;
  if (rig.guitarType && g.guitars?.length) { tot+=30; sc+=g.guitars.includes(rig.guitarType)?30:8; }
  if (rig.pickup     && g.pickups?.length) { tot+=20; sc+=g.pickups.includes(rig.pickup)?20:5; }
  if (rig.ampBrand   && g.amps?.length)    { tot+=25; sc+=g.amps.includes(rig.ampBrand)?25:6; }
  if (rig.ampModel   && g.models?.length)  { tot+=10; sc+=g.models.includes(rig.ampModel)?10:2; }
  if (rig.cab        && g.cabs?.length)    { tot+=8;  sc+=g.cabs.includes(rig.cab)?8:2; }
  const fxHits=(rig.effects||[]).filter(f=>g.fx?.includes(f)).length;
  if (g.fx?.length) { tot+=7; sc+=Math.min(7,fxHits*2.5); }
  return tot===0?null:Math.round(55+(sc/tot)*44);
}

function rigGaps(song, rig) {
  const g = song.idealGear || {};
  const gaps = [];
  if (rig.guitarType && g.guitars?.length && !g.guitars.includes(rig.guitarType)) {
    const ideal = g.guitars.map(id=>RIG.guitarTypes.find(x=>x.id===id)?.label).filter(Boolean);
    gaps.push(`Ideal guitar: ${ideal.join(' or ')}`);
  }
  if (rig.ampBrand && g.amps?.length && !g.amps.includes(rig.ampBrand)) {
    const ideal = g.amps.map(id=>RIG.ampBrands.find(x=>x.id===id)?.label).filter(Boolean);
    gaps.push(`Ideal amp: ${ideal.join(' or ')}`);
  }
  const missingFx = (g.fx||[]).filter(f=>!(rig.effects||[]).includes(f));
  if (missingFx.length) {
    gaps.push(`Missing FX: ${missingFx.map(id=>RIG.effects.find(e=>e.id===id)?.label||id).join(', ')}`);
  }
  return gaps;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function Toast({ msg, visible }) {
  if (!visible) return null;
  return (
    <div style={{ position:'fixed', bottom:32, left:'50%', background:T.green, color:'#fff', padding:'12px 24px', borderRadius:28, fontFamily:'DM Mono,monospace', fontSize:13, zIndex:9999, animation:'toastIn 0.3s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', whiteSpace:'nowrap' }}>
      {msg}
    </div>
  );
}

function ToneRing({ pct, size=120 }) {
  const r = size/2 - 9;
  const circ = 2*Math.PI*r;
  const dash = pct==null ? 0 : (pct/100)*circ;
  const color = pct==null ? T.muted : pct>=85 ? T.green : pct>=70 ? T.amber : T.orange;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:'DM Mono,monospace', fontSize:size<80?13:size<100?16:22, fontWeight:600, color }}>
          {pct!=null?`${pct}%`:'—'}
        </span>
        <span style={{ fontFamily:'DM Mono,monospace', fontSize:7, color:T.muted, textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>rig fit</span>
      </div>
    </div>
  );
}

function VinylRecord({ spinning, song, size=160 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`radial-gradient(circle at 30% 30%, ${song?.color||T.vinyl} 0%, #1a0a04 60%, #080302 100%)`, position:'relative', flexShrink:0, boxShadow:'0 12px 40px rgba(0,0,0,0.7)', animation:spinning?'spin 4s linear infinite':'none' }}>
      {[0.36,0.44,0.52,0.60].map((r,i)=>(
        <div key={i} style={{ position:'absolute', top:`${(1-r)*size/2}px`, left:`${(1-r)*size/2}px`, right:`${(1-r)*size/2}px`, bottom:`${(1-r)*size/2}px`, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.04)' }}/>
      ))}
      <div style={{ position:'absolute', inset:'38%', borderRadius:'50%', background:T.surface, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:T.muted }}/>
      </div>
    </div>
  );
}

function Waveform({ active }) {
  const bars = Array.from({length:20},(_,i)=>({
    h: 6 + Math.abs(Math.sin(i*0.72+0.3))*18 + (i%3)*2,
    delay: i*0.05,
  }));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:28 }}>
      {bars.map((b,i)=>(
        <div key={i} style={{ width:3, borderRadius:2, background:active?`linear-gradient(to top,${T.amber},${T.orange})`:T.border, '--wh':`${b.h}px`, height:active?undefined:`${Math.max(4,b.h*0.4)}px`, animation:active?`wa 0.6s ease ${b.delay}s infinite alternate`:'none', minHeight:3 }}/>
      ))}
    </div>
  );
}

function RigMatchBadge({ pct }) {
  if (pct==null) return null;
  const color = pct>=85?T.green:pct>=70?T.amber:T.orange;
  return (
    <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:600, color, background:`${color}22`, padding:'3px 8px', borderRadius:10, border:`1px solid ${color}44`, flexShrink:0 }}>
      {pct}% fit
    </span>
  );
}

function Chip({ label, dim, accent }) {
  return (
    <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:accent?T.amber:dim?T.muted:T.cream, background:T.raised, border:`1px solid ${accent?T.amber:T.border}`, padding:'3px 8px', borderRadius:10, whiteSpace:'nowrap' }}>
      {label}
    </span>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>{children}</div>;
}

function OptionCard({ item, selected, onSelect, compact }) {
  return (
    <button onClick={()=>onSelect(item.id)} style={{ background:selected?`${T.amber}18`:T.raised, border:`2px solid ${selected?T.amber:T.border}`, borderRadius:12, padding:compact?'10px 8px':'14px 10px', cursor:'pointer', textAlign:'center', transition:'all 0.15s', color:T.cream, width:'100%' }}>
      {item.icon&&<div style={{ fontSize:18, marginBottom:4 }}>{item.icon}</div>}
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:compact?9:11, fontWeight:600, color:selected?T.amber:T.cream }}>{item.label}</div>
      {item.desc&&!compact&&<div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, marginTop:3, lineHeight:1.4 }}>{item.desc}</div>}
    </button>
  );
}

function StepNav({ step, total, onBack, onNext, onSave, disabled }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:24, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
      <button onClick={onBack} disabled={step===0} style={{ fontFamily:'DM Mono,monospace', fontSize:12, color:step===0?T.muted:T.cream, background:T.raised, border:`1px solid ${T.border}`, padding:'10px 20px', borderRadius:24, cursor:step===0?'default':'pointer', opacity:step===0?0.5:1 }}>← Back</button>
      <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.muted }}>{step+1} / {total}</span>
      {onSave?(
        <button onClick={onSave} style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'#1A0F07', background:`linear-gradient(135deg,${T.amber},${T.orange})`, border:'none', padding:'10px 24px', borderRadius:24, cursor:'pointer', boxShadow:`0 4px 16px ${T.amber}44` }}>Save My Rig ✓</button>
      ):(
        <button onClick={onNext} disabled={disabled} style={{ fontFamily:'DM Mono,monospace', fontSize:12, color:disabled?T.muted:'#1A0F07', background:disabled?T.raised:`linear-gradient(135deg,${T.amber},${T.orange})`, border:`1px solid ${disabled?T.border:'transparent'}`, padding:'10px 20px', borderRadius:24, cursor:disabled?'default':'pointer' }}>Continue →</button>
      )}
    </div>
  );
}

function Knob({ label, value, onChange }) {
  const drag = useRef(null);
  const angle = -135 + (value/10)*270;

  const onMouseDown = e => {
    e.preventDefault();
    drag.current = { startY:e.clientY, startVal:value };
    const onMove = e2 => {
      const delta = (drag.current.startY - e2.clientY)/80*10;
      onChange(Math.max(0,Math.min(10, drag.current.startVal+delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, userSelect:'none' }}>
      <div onMouseDown={onMouseDown} style={{ width:46, height:46, borderRadius:'50%', background:`radial-gradient(circle at 35% 35%,${T.raised},${T.vinyl})`, border:`2px solid ${T.border}`, cursor:'ns-resize', position:'relative', boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:2, height:14, background:T.amber, borderRadius:1, transformOrigin:'bottom center', transform:`rotate(${angle}deg) translateY(-5px)` }}/>
        </div>
      </div>
      <span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
      <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.amber }}>{value.toFixed(1)}</span>
    </div>
  );
}

function Pedal({ pedal, idx, dragIdx, onDragStart, onDragOver, onDragEnd }) {
  const color = PEDAL_CLR[pedal]||T.muted;
  return (
    <div draggable onDragStart={()=>onDragStart(idx)} onDragOver={e=>{e.preventDefault();onDragOver(idx);}} onDragEnd={onDragEnd}
      style={{ padding:'8px 14px', borderRadius:10, background:T.vinyl, border:`1px solid ${color}55`, cursor:'grab', userSelect:'none', opacity:dragIdx===idx?0.3:1, transition:'opacity 0.2s', display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}` }}/>
      <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.cream }}>{pedal}</span>
    </div>
  );
}

// ─── AUDIO PLAYER ─────────────────────────────────────────────────────────────

function AudioPlayer({ song }) {
  const [mode, setMode] = useState('spotify');
  const [spotifyId, setSpotifyId] = useState('');
  const [searching, setSearching] = useState(false);
  const [ytInput, setYtInput] = useState('');
  const [ytId, setYtId] = useState('');

  useEffect(() => {
    setMode('spotify');
    setSpotifyId('');
    setSearching(false);
    setYtInput('');
    setYtId(song.ytId||'');
  }, [song.id]);

  const extractYtId = url => {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m?m[1]:url.trim().length===11?url.trim():'';
  };

  const findSpotify = async () => {
    setSearching(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const headers = { 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers,
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:100,
          system:'You are a Spotify track ID finder. Return ONLY the URI in format: spotify:track:TRACKID or "not_found".',
          messages:[{role:'user',content:`Find Spotify track ID for: "${song.title}" by "${song.artist}"`}],
          mcp_servers:[{type:'url',url:'https://mcp-gateway-external-pilot.spotify.net/mcp',name:'spotify'}],
        }),
      });
      const data = await res.json();
      const txt = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      const m = txt.match(/spotify:track:([A-Za-z0-9]+)/);
      if (m) { setSpotifyId(m[1]); setMode('spotify_embed'); }
      else setMode('youtube');
    } catch { setMode('youtube'); }
    setSearching(false);
  };

  const tabBtn = (id, label) => (
    <button key={id} onClick={()=>setMode(id)} style={{ flex:1, padding:'10px 0', fontFamily:'DM Mono,monospace', fontSize:10, textTransform:'uppercase', letterSpacing:1, color:mode.startsWith(id)?T.amber:T.muted, borderBottom:`2px solid ${mode.startsWith(id)?T.amber:'transparent'}`, background:'transparent', cursor:'pointer', transition:'all 0.2s' }}>
      {label}
    </button>
  );

  return (
    <div style={{ background:T.raised, borderRadius:14, border:`1px solid ${T.border}`, overflow:'hidden' }}>
      <div style={{ display:'flex', borderBottom:`1px solid ${T.border}` }}>
        {tabBtn('spotify','🎵 Spotify')}
        {tabBtn('youtube','▶ YouTube')}
      </div>
      <div style={{ padding:16, minHeight:110 }}>
        {mode==='spotify'&&(
          <div style={{ textAlign:'center', paddingTop:8 }}>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.muted, marginBottom:12 }}>Find this track on Spotify</div>
            <button onClick={findSpotify} disabled={searching} style={{ background:searching?T.raised:'#1DB954', color:'#fff', border:'none', borderRadius:24, padding:'10px 22px', fontFamily:'DM Mono,monospace', fontSize:12, cursor:searching?'default':'pointer', opacity:searching?0.7:1 }}>
              {searching?'Searching…':'🎵 Find on Spotify'}
            </button>
          </div>
        )}
        {mode==='spotify_embed'&&spotifyId&&(
          <iframe src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" style={{ borderRadius:8 }}/>
        )}
        {mode==='youtube'&&(
          ytId?(
            <iframe src={`https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0`} width="100%" height="140" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ borderRadius:8 }}/>
          ):(
            <div>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.muted, marginBottom:8 }}>Paste YouTube URL or video ID</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={ytInput} onChange={e=>setYtInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setYtId(extractYtId(ytInput))} placeholder="youtube.com/watch?v=…" style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 12px', color:T.cream, fontFamily:'DM Mono,monospace', fontSize:11, outline:'none' }}/>
                <button onClick={()=>setYtId(extractYtId(ytInput))} style={{ background:T.amber, color:'#1A0F07', border:'none', borderRadius:8, padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:11, cursor:'pointer' }}>Load</button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── RIG BANNER ───────────────────────────────────────────────────────────────

function RigBanner({ myRig, activeSong, onEdit }) {
  const match = calcRigMatch(activeSong, myRig);
  const hasRig = myRig.guitarType || myRig.ampBrand;
  const guitarLabel = RIG.guitarTypes.find(g=>g.id===myRig.guitarType)?.label;
  const ampLabel = myRig.ampModel || RIG.ampBrands.find(a=>a.id===myRig.ampBrand)?.label;
  const pickupLabel = RIG.pickupTypes.find(p=>p.id===myRig.pickup)?.label;

  return (
    <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'8px 32px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', minHeight:42 }}>
      <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, textTransform:'uppercase', letterSpacing:2, flexShrink:0 }}>My Rig</span>
      {hasRig?(
        <>
          {guitarLabel&&<Chip label={guitarLabel}/>}
          {pickupLabel&&<Chip label={pickupLabel} dim/>}
          {ampLabel&&<Chip label={ampLabel}/>}
          {myRig.effects.length>0&&<Chip label={`${myRig.effects.length} FX`} dim/>}
          {match!=null&&<RigMatchBadge pct={match}/>}
          <button onClick={onEdit} style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.amber, background:'transparent', border:`1px solid ${T.border}`, borderRadius:10, padding:'3px 10px', marginLeft:4 }}>Edit</button>
        </>
      ):(
        <button onClick={onEdit} style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.amber, background:'transparent', border:`1px solid ${T.border}`, borderRadius:10, padding:'5px 14px' }}>+ Set Up My Rig</button>
      )}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ screen, setScreen, myRig, runAnalyze }) {
  const hasRig = myRig.guitarType || myRig.ampBrand;
  const items = [
    { id:'home',     label:'Home' },
    { id:'rig',      label:'My Rig', dot:hasRig },
    { id:'discover', label:'Discover' },
    { id:'patches',  label:'Patches' },
    { id:'spotify',  label:'Search' },
  ];
  return (
    <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'0 32px', display:'flex', alignItems:'center', height:56, gap:8, position:'sticky', top:0, zIndex:100 }}>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:24, color:T.amber, marginRight:24, letterSpacing:'-0.5px', flexShrink:0 }}>ToneAI</div>
      <div style={{ display:'flex', gap:2, flex:1 }}>
        {items.map(item=>(
          <button key={item.id} onClick={()=>setScreen(item.id)} style={{ fontFamily:'DM Mono,monospace', fontSize:10, textTransform:'uppercase', letterSpacing:1.5, color:screen===item.id?T.amber:T.muted, background:screen===item.id?`${T.amber}18`:'transparent', border:'none', padding:'6px 14px', borderRadius:20, cursor:'pointer', position:'relative', transition:'all 0.2s' }}>
            {item.label}
            {item.dot&&<span style={{ position:'absolute', top:5, right:6, width:5, height:5, borderRadius:'50%', background:T.green }}/>}
          </button>
        ))}
      </div>
      <button onClick={runAnalyze} style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'#1A0F07', background:`linear-gradient(135deg,${T.amber},${T.orange})`, border:'none', padding:'9px 22px', borderRadius:24, cursor:'pointer', boxShadow:`0 4px 16px ${T.amber}44`, flexShrink:0 }}>
        Analyze Tone
      </button>
    </nav>
  );
}

// ─── NOW PLAYING BAR ──────────────────────────────────────────────────────────

function NowPlayingBar({ activeSong, vinylSpin, rigMatch }) {
  return (
    <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'10px 32px', display:'flex', alignItems:'center', gap:16 }}>
      <VinylRecord spinning={vinylSpin} song={activeSong} size={46}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:15, color:T.cream, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activeSong.title}</div>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, marginTop:2 }}>{activeSong.artist}</div>
      </div>
      <Waveform active={vinylSpin}/>
      <div style={{ display:'flex', gap:16, borderLeft:`1px solid ${T.border}`, paddingLeft:16 }}>
        {[{l:'BPM',v:activeSong.bpm},{l:'Key',v:activeSong.key},{l:'Tune',v:activeSong.tuning.split(' ')[0]}].map(({l,v})=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:12, color:T.cream, marginTop:2 }}>{v}</div>
          </div>
        ))}
      </div>
      <ToneRing pct={rigMatch} size={54}/>
    </div>
  );
}

// ─── SONG CARD ────────────────────────────────────────────────────────────────

function SongCard({ song, active, myRig, onClick }) {
  const match = calcRigMatch(song, myRig);
  return (
    <div onClick={onClick} style={{ background:active?`${song.color}20`:T.surface, border:`2px solid ${active?song.color:T.border}`, borderRadius:14, padding:16, cursor:'pointer', transition:'all 0.2s', animation:'fadeUp 0.3s ease' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:`radial-gradient(circle at 30% 30%,${song.color},#0a0302)`, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 12px ${song.color}44` }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:T.surface }}/>
      </div>
      <div style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:T.cream, marginBottom:3, lineHeight:1.2 }}>{song.title}</div>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, marginBottom:8 }}>{song.artist}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:4 }}>
        <span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, background:T.raised, padding:'2px 6px', borderRadius:8 }}>{song.genre}</span>
        {match!=null?<RigMatchBadge pct={match}/>:<span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted }}>{song.match}%</span>}
      </div>
    </div>
  );
}

// ─── RIG SCREEN ───────────────────────────────────────────────────────────────

function RigScreen({ rig, setMyRig, setScreen, showToast }) {
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState({ ...rig });

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]:val }));
  const toggleFx = id => setLocal(prev => ({
    ...prev,
    effects: prev.effects.includes(id) ? prev.effects.filter(x=>x!==id) : [...prev.effects, id],
  }));

  const saveRig = () => {
    setMyRig(local);
    showToast('Rig saved! ✓');
    setScreen('home');
  };

  const canNext = [
    !!local.guitarType,
    !!local.pickup,
    !!local.ampType,
    !!local.ampBrand,
    !!local.cab,
    true,
  ];

  const selectedBrand = RIG.ampBrands.find(b=>b.id===local.ampBrand);
  const guitarLabel = RIG.guitarTypes.find(g=>g.id===local.guitarType)?.label||'—';
  const pickupLabel = RIG.pickupTypes.find(p=>p.id===local.pickup)?.label||'—';
  const ampBrandLabel = RIG.ampBrands.find(a=>a.id===local.ampBrand)?.label||'—';
  const cabLabel = RIG.cabinets.find(c=>c.id===local.cab)?.label||'—';
  const fxCount = local.effects.length;

  const STEPS = ['Guitar','Pickups','Amp Type','Amp Model','Cabinet','Effects'];

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 32px', animation:'fadeUp 0.3s ease' }}>
      {/* Progress bar */}
      <div style={{ display:'flex', gap:4, marginBottom:32 }}>
        {STEPS.map((s,i)=>(
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=step?T.amber:T.border, transition:'background 0.3s' }}/>
        ))}
      </div>

      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:T.cream, marginBottom:6 }}>
        {['What guitar do you play?','What are your pickups?','What type of amp?','Which amp brand & model?','What cabinet?','Which effects do you use?'][step]}
      </h2>
      <p style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.muted, marginBottom:24, letterSpacing:0.5 }}>
        {['This shapes the fundamental character of your tone.','Pickups define your gain structure and frequency response.','Tube, solid state, or modelling — each sounds different.','Your amp brand is the biggest factor in tone colour.','The cabinet shapes the final sound before your ears.','Select all the effects in your signal chain.'][step]}
      </p>

      {step===0&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {RIG.guitarTypes.map(item=><OptionCard key={item.id} item={item} selected={local.guitarType===item.id} onSelect={v=>set('guitarType',v)}/>)}
        </div>
      )}

      {step===1&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {RIG.pickupTypes.map(item=><OptionCard key={item.id} item={item} selected={local.pickup===item.id} onSelect={v=>set('pickup',v)} compact/>)}
        </div>
      )}

      {step===2&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {RIG.ampTypes.map(item=><OptionCard key={item.id} item={item} selected={local.ampType===item.id} onSelect={v=>set('ampType',v)}/>)}
        </div>
      )}

      {step===3&&(
        <div>
          <SectionLabel>Brand</SectionLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {RIG.ampBrands.map(b=>(
              <button key={b.id} onClick={()=>{ set('ampBrand',b.id); set('ampModel',''); }} style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:local.ampBrand===b.id?'#1A0F07':T.cream, background:local.ampBrand===b.id?T.amber:T.raised, border:`1px solid ${local.ampBrand===b.id?T.amber:T.border}`, padding:'7px 16px', borderRadius:20, cursor:'pointer' }}>{b.label}</button>
            ))}
          </div>
          {selectedBrand&&(
            <>
              <SectionLabel>Model</SectionLabel>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {selectedBrand.models.map(m=>(
                  <button key={m} onClick={()=>set('ampModel',m)} style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:local.ampModel===m?'#1A0F07':T.cream, background:local.ampModel===m?T.amber:T.raised, border:`1px solid ${local.ampModel===m?T.amber:T.border}`, padding:'7px 16px', borderRadius:20, cursor:'pointer' }}>{m}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step===4&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {RIG.cabinets.map(item=><OptionCard key={item.id} item={item} selected={local.cab===item.id} onSelect={v=>set('cab',v)}/>)}
        </div>
      )}

      {step===5&&(
        <div>
          {RIG.effectGroups.map(group=>{
            const groupFx = RIG.effects.filter(e=>group.types.includes(e.type));
            return (
              <div key={group.label} style={{ marginBottom:18 }}>
                <SectionLabel>{group.label}</SectionLabel>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {groupFx.map(fx=>{
                    const on = local.effects.includes(fx.id);
                    return (
                      <button key={fx.id} onClick={()=>toggleFx(fx.id)} style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:on?'#1A0F07':T.cream, background:on?fx.color:T.raised, border:`1px solid ${on?fx.color:T.border}`, padding:'6px 14px', borderRadius:20, cursor:'pointer', transition:'all 0.15s' }}>{fx.label}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Review summary */}
          <div style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginTop:24 }}>
            <SectionLabel>Rig Summary</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {local.guitarType&&<Chip label={guitarLabel}/>}
              {local.pickup&&<Chip label={pickupLabel} dim/>}
              {local.ampBrand&&<Chip label={`${ampBrandLabel}${local.ampModel?` ${local.ampModel}`:''}`}/>}
              {local.cab&&<Chip label={cabLabel} dim/>}
              {fxCount>0&&<Chip label={`${fxCount} effects`} accent/>}
            </div>
          </div>
        </div>
      )}

      <StepNav step={step} total={6} onBack={()=>setStep(s=>Math.max(0,s-1))} onNext={()=>setStep(s=>Math.min(5,s+1))} onSave={step===5?saveRig:undefined} disabled={!canNext[step]}/>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────

function HomeScreen({ activeSong, setActiveSong, setScreen, runAnalyze, myRig }) {
  return (
    <div style={{ padding:'40px 32px', animation:'fadeUp 0.4s ease' }}>
      <div style={{ textAlign:'center', marginBottom:52 }}>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, textTransform:'uppercase', letterSpacing:3, marginBottom:14 }}>AI-Powered Guitar Tone Analysis</div>
        <h1 style={{ fontFamily:'DM Serif Display,serif', fontSize:clamp(32,52), color:T.cream, lineHeight:1.1, marginBottom:18 }}>
          Your rig.<br/><span style={{ color:T.amber }}>Any song.</span><br/>Exact settings.
        </h1>
        <p style={{ fontFamily:'Georgia,serif', fontSize:16, color:T.muted, maxWidth:480, margin:'0 auto 28px', lineHeight:1.6 }}>
          Drop any Indian or global song. ToneAI gives you the exact gear, signal chain, and EQ to recreate that tone on your specific rig.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={runAnalyze} style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:'#1A0F07', background:`linear-gradient(135deg,${T.amber},${T.orange})`, border:'none', padding:'14px 32px', borderRadius:28, cursor:'pointer', boxShadow:`0 8px 32px ${T.amber}44`, animation:'pulse 3s ease infinite' }}>
            Analyze "{activeSong.title}"
          </button>
          <button onClick={()=>setScreen('discover')} style={{ fontFamily:'DM Mono,monospace', fontSize:13, color:T.cream, background:T.raised, border:`1px solid ${T.border}`, padding:'14px 24px', borderRadius:28, cursor:'pointer' }}>
            Browse Songs →
          </button>
        </div>
      </div>

      <SectionLabel>Featured Songs</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12 }}>
        {SONGS.slice(0,8).map(song=>(
          <SongCard key={song.id} song={song} active={activeSong.id===song.id} myRig={myRig} onClick={()=>setActiveSong(song)}/>
        ))}
      </div>
    </div>
  );
}

function clamp(min, max) { return `clamp(${min}px,4vw,${max}px)`; }

// ─── ANALYZE SCREEN ───────────────────────────────────────────────────────────

const ANALYZE_STEPS = ['Parsing song context…','Analyzing signal chain…','Calibrating to your rig…','Generating tone map…'];

function AnalyzeScreen({ activeSong, myRig, sessionRig, setSessionRig, activeRig, rigMatch, gaps, isAnalyzing, analyzeStep, aiResult, urlInput, setUrlInput, chain, setChain, dragIdx, setDragIdx, eq, setEq, runAnalyze, savePatch, showToast, vinylSpin }) {
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [tempRig, setTempRig] = useState({ ...EMPTY_RIG });

  const guitarLabel = RIG.guitarTypes.find(g=>g.id===activeRig.guitarType)?.label;
  const ampLabel = activeRig.ampModel || RIG.ampBrands.find(a=>a.id===activeRig.ampBrand)?.label;

  const applySession = () => { setSessionRig({ ...tempRig }); setShowSessionPanel(false); showToast('Session rig applied'); };
  const clearSession = () => { setSessionRig(null); showToast('Back to My Rig'); };

  const onDragStart = idx => setDragIdx(idx);
  const onDragOver = idx => {
    if (dragIdx===null || dragIdx===idx) return;
    setChain(prev => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx,1);
      arr.splice(idx,0,item);
      setDragIdx(idx);
      return arr;
    });
  };
  const onDragEnd = () => setDragIdx(null);

  return (
    <div style={{ display:'flex', gap:0, minHeight:'calc(100vh - 160px)', animation:'fadeUp 0.3s ease' }}>
      {/* Left panel */}
      <div style={{ flex:1, padding:'32px 28px', minWidth:0, borderRight:`1px solid ${T.border}` }}>

        {/* Active rig row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 14px', background:T.raised, borderRadius:10, border:`1px solid ${T.border}` }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:sessionRig?T.amber:T.green }}/>
          <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:1 }}>{sessionRig?'Session Rig':'My Rig'}</span>
          {guitarLabel&&<Chip label={guitarLabel}/>}
          {ampLabel&&<Chip label={ampLabel}/>}
          <div style={{ flex:1 }}/>
          {sessionRig&&<button onClick={clearSession} style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.orange, background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'3px 8px' }}>Clear</button>}
          <button onClick={()=>setShowSessionPanel(v=>!v)} style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.amber, background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'3px 8px' }}>Override</button>
        </div>

        {/* Session override panel */}
        {showSessionPanel&&(
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:18, marginBottom:20 }}>
            <SectionLabel>Temporary Rig Override</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              <select value={tempRig.guitarType} onChange={e=>setTempRig(p=>({...p,guitarType:e.target.value}))} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 10px', color:T.cream, fontFamily:'DM Mono,monospace', fontSize:11 }}>
                <option value="">Guitar…</option>
                {RIG.guitarTypes.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
              <select value={tempRig.ampBrand} onChange={e=>setTempRig(p=>({...p,ampBrand:e.target.value}))} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 10px', color:T.cream, fontFamily:'DM Mono,monospace', fontSize:11 }}>
                <option value="">Amp…</option>
                {RIG.ampBrands.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <button onClick={applySession} style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#1A0F07', background:T.amber, border:'none', borderRadius:20, padding:'7px 18px', cursor:'pointer' }}>Apply for This Song</button>
          </div>
        )}

        {/* URL input */}
        <div style={{ marginBottom:20 }}>
          <SectionLabel>Song URL or Search</SectionLabel>
          <div style={{ display:'flex', gap:8 }}>
            <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runAnalyze()} placeholder="Paste Spotify/YouTube URL, or leave blank to analyze current song…" style={{ flex:1, background:T.raised, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', color:T.cream, fontFamily:'DM Mono,monospace', fontSize:11, outline:'none' }}/>
            <button onClick={runAnalyze} disabled={isAnalyzing} style={{ fontFamily:'DM Serif Display,serif', fontSize:13, color:'#1A0F07', background:isAnalyzing?T.raised:`linear-gradient(135deg,${T.amber},${T.orange})`, border:'none', borderRadius:10, padding:'10px 20px', cursor:isAnalyzing?'default':'pointer', whiteSpace:'nowrap' }}>
              {isAnalyzing?'Analyzing…':'Analyze'}
            </button>
          </div>
        </div>

        {/* Progress */}
        {isAnalyzing&&(
          <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:20 }}>
            {ANALYZE_STEPS.map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', opacity:i<=analyzeStep?1:0.3, transition:'opacity 0.4s' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:i<analyzeStep?T.green:i===analyzeStep?T.amber:T.border, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.4s', flexShrink:0, animation:i===analyzeStep?'shimmer 1s ease infinite':'' }}>
                  {i<analyzeStep&&<span style={{ fontSize:10 }}>✓</span>}
                </div>
                <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:i===analyzeStep?T.cream:T.muted }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Result */}
        {aiResult&&!isAnalyzing&&(
          <div style={{ animation:'fadeUp 0.5s ease' }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:15, color:T.amber, fontStyle:'italic', marginBottom:16, lineHeight:1.5 }}>"{aiResult.vibe}"</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[{l:'Amp Setting',v:aiResult.amp},{l:'Overdrive',v:aiResult.overdrive},{l:'Cabinet',v:aiResult.cabinet},{l:'Delay',v:aiResult.delay},{l:'Reverb',v:aiResult.reverb}].filter(x=>x.v).map(({l,v})=>(
                  <div key={l} style={{ background:T.raised, borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{l}</div>
                    <div style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.cream }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {aiResult.rig_tips?.length>0&&(
              <div style={{ background:`${T.green}12`, border:`1px solid ${T.green}33`, borderRadius:12, padding:16, marginBottom:16 }}>
                <SectionLabel>Rig Tips for Your Gear</SectionLabel>
                {aiResult.rig_tips.map((tip,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                    <span style={{ color:T.green, flexShrink:0, fontFamily:'DM Mono,monospace', fontSize:11 }}>▸</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.cream, lineHeight:1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {aiResult.swap_suggestions?.length>0&&(
              <div style={{ background:`${T.amber}10`, border:`1px solid ${T.amber}33`, borderRadius:12, padding:16, marginBottom:16 }}>
                <SectionLabel>Upgrade Suggestions</SectionLabel>
                {aiResult.swap_suggestions.map((s,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, marginBottom:4 }}>
                    <span style={{ color:T.amber, fontFamily:'DM Mono,monospace', fontSize:11, flexShrink:0 }}>→</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.cream, lineHeight:1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {gaps.length>0&&(
              <div style={{ background:`${T.orange}10`, border:`1px solid ${T.orange}33`, borderRadius:12, padding:16, marginBottom:16 }}>
                <SectionLabel>Gear Gaps</SectionLabel>
                {gaps.map((g,i)=>(
                  <div key={i} style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.muted, marginBottom:4 }}>⚠ {g}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Signal chain */}
        {(aiResult||chain.length>0)&&(
          <div style={{ marginBottom:20 }}>
            <SectionLabel>Signal Chain — drag to reorder</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'12px', background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, minHeight:56 }}>
              {chain.map((pedal,idx)=>(
                <React.Fragment key={`${pedal}-${idx}`}>
                  <Pedal pedal={pedal} idx={idx} dragIdx={dragIdx} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}/>
                  {idx<chain.length-1&&<div style={{ display:'flex', alignItems:'center', color:T.muted, fontSize:12, fontFamily:'DM Mono,monospace' }}>→</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* EQ Knobs */}
        {aiResult&&(
          <div style={{ marginBottom:24 }}>
            <SectionLabel>EQ Settings</SectionLabel>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap', padding:'16px', background:T.surface, borderRadius:12, border:`1px solid ${T.border}` }}>
              {Object.entries(eq).map(([key,val])=>(
                <Knob key={key} label={key.charAt(0).toUpperCase()+key.slice(1)} value={val} onChange={v=>setEq(prev=>({...prev,[key]:+v.toFixed(1)}))}/>
              ))}
            </div>
          </div>
        )}

        {aiResult&&(
          <button onClick={savePatch} style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'#1A0F07', background:`linear-gradient(135deg,${T.amber},${T.orange})`, border:'none', padding:'12px 28px', borderRadius:24, cursor:'pointer', boxShadow:`0 4px 16px ${T.amber}33` }}>
            Save Patch ✦
          </button>
        )}
      </div>

      {/* Right panel */}
      <div style={{ width:340, flexShrink:0, padding:'28px 20px', position:'sticky', top:56, height:'fit-content' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <VinylRecord spinning={vinylSpin} song={activeSong} size={160}/>
        </div>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontFamily:'DM Serif Display,serif', fontSize:20, color:T.cream, marginBottom:4 }}>{activeSong.title}</div>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.muted }}>{activeSong.artist}</div>
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <ToneRing pct={rigMatch} size={110}/>
        </div>

        <div style={{ marginBottom:20 }}>
          <AudioPlayer song={activeSong}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
          {[{l:'BPM',v:activeSong.bpm},{l:'Key',v:activeSong.key},{l:'Tuning',v:activeSong.tuning},{l:'Genre',v:activeSong.genre.split(' ')[0]}].map(({l,v})=>(
            <div key={l} style={{ background:T.raised, borderRadius:10, padding:'10px', textAlign:'center' }}>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:13, color:T.cream, marginTop:4 }}>{v}</div>
            </div>
          ))}
        </div>

        <div>
          <SectionLabel>Ideal Gear</SectionLabel>
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:14 }}>
            {[
              {l:'Guitars', items:activeSong.idealGear.guitars, lookup:id=>RIG.guitarTypes.find(x=>x.id===id)?.label},
              {l:'Pickups', items:activeSong.idealGear.pickups, lookup:id=>RIG.pickupTypes.find(x=>x.id===id)?.label},
              {l:'Amps',    items:activeSong.idealGear.amps,    lookup:id=>RIG.ampBrands.find(x=>x.id===id)?.label},
              {l:'Cabinet', items:activeSong.idealGear.cabs,    lookup:id=>RIG.cabinets.find(x=>x.id===id)?.label},
            ].map(({l,items,lookup})=>items?.length?(
              <div key={l} style={{ marginBottom:10 }}>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>{l}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {items.map(id=>{
                    const label = lookup(id)||id;
                    const owned = (activeRig.guitarType===id)||(activeRig.ampBrand===id)||(activeRig.pickup===id)||(activeRig.cab===id);
                    return <span key={id} style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:owned?T.green:T.muted, background:owned?`${T.green}18`:T.raised, border:`1px solid ${owned?T.green:T.border}`, padding:'2px 7px', borderRadius:8 }}>{label}</span>;
                  })}
                </div>
              </div>
            ):null)}
            {activeSong.idealGear.fx?.length>0&&(
              <div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Effects</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {activeSong.idealGear.fx.map(id=>{
                    const eff = RIG.effects.find(e=>e.id===id);
                    const owned = activeRig.effects?.includes(id);
                    return <span key={id} style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:owned?T.green:T.muted, background:owned?`${T.green}18`:T.raised, border:`1px solid ${owned?T.green:T.border}`, padding:'2px 7px', borderRadius:8 }}>{eff?.label||id}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DISCOVER SCREEN ──────────────────────────────────────────────────────────

function DiscoverScreen({ activeSong, setActiveSong, genre, setGenre, myRig, runAnalyze }) {
  const filtered = genre==='All' ? SONGS : SONGS.filter(s=>s.genre===genre);
  return (
    <div style={{ padding:'32px', animation:'fadeUp 0.3s ease' }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:T.cream, marginBottom:20 }}>Discover Indian Guitar Music</h2>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:28 }}>
        {GENRES.map(g=>(
          <button key={g} onClick={()=>setGenre(g)} style={{ fontFamily:'DM Mono,monospace', fontSize:10, textTransform:'uppercase', letterSpacing:1, color:genre===g?'#1A0F07':T.muted, background:genre===g?T.amber:T.raised, border:`1px solid ${genre===g?T.amber:T.border}`, padding:'7px 16px', borderRadius:20, cursor:'pointer', transition:'all 0.2s' }}>{g}</button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
        {filtered.map(song=>(
          <div key={song.id} onClick={()=>setActiveSong(song)} style={{ cursor:'pointer' }}>
            <SongCard song={song} active={activeSong.id===song.id} myRig={myRig} onClick={()=>setActiveSong(song)}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PATCHES SCREEN ───────────────────────────────────────────────────────────

function PatchesScreen({ savedPatches, setActiveSong, setScreen, showToast }) {
  const [tab, setTab] = useState('artist');

  const loadPatch = (patch) => {
    setActiveSong(patch.song);
    setScreen('analyze');
    showToast(`Loaded patch: ${patch.song.title}`);
  };

  return (
    <div style={{ padding:'32px', animation:'fadeUp 0.3s ease' }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:T.cream, marginBottom:20 }}>Tone Patches</h2>
      <div style={{ display:'flex', gap:2, marginBottom:28, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {[['artist','Artist Patches'],['mine','My Patches']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ fontFamily:'DM Mono,monospace', fontSize:11, textTransform:'uppercase', letterSpacing:1.5, color:tab===id?T.amber:T.muted, background:'transparent', border:'none', borderBottom:`2px solid ${tab===id?T.amber:'transparent'}`, padding:'10px 20px', cursor:'pointer', transition:'all 0.2s' }}>{label}</button>
        ))}
      </div>

      {tab==='artist'&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {ARTIST_PATCHES.map(patch=>(
            <div key={patch.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:T.cream, marginBottom:3 }}>{patch.name}</div>
                  <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, textTransform:'uppercase', letterSpacing:1 }}>{patch.genre}</div>
                </div>
                <ToneRing pct={Math.round(patch.gain*10)} size={52}/>
              </div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:12, color:T.muted, fontStyle:'italic', marginBottom:12, lineHeight:1.5 }}>"{patch.vibe}"</div>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:T.cream, marginBottom:10 }}>{patch.amp}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                {patch.chain.map((p,i)=>(
                  <span key={i} style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:PEDAL_CLR[p]||T.muted, background:`${PEDAL_CLR[p]||T.muted}18`, border:`1px solid ${PEDAL_CLR[p]||T.muted}44`, padding:'2px 8px', borderRadius:8 }}>{p}</span>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, borderTop:`1px solid ${T.border}`, paddingTop:10 }}>
                {[['G',patch.gain],['B',patch.bass],['M',patch.middle],['T',patch.treble],['P',patch.presence]].map(([l,v])=>(
                  <div key={l} style={{ textAlign:'center', flex:1 }}>
                    <div style={{ fontFamily:'DM Mono,monospace', fontSize:7, color:T.muted, textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.amber, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='mine'&&(
        savedPatches.length===0?(
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:T.muted, marginBottom:12 }}>No saved patches yet</div>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:T.muted }}>Analyze a song and click "Save Patch" to save your tone settings.</div>
          </div>
        ):(
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {savedPatches.map(patch=>(
              <div key={patch.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18 }}>
                <div style={{ fontFamily:'DM Serif Display,serif', fontSize:16, color:T.cream, marginBottom:4 }}>{patch.song.title}</div>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, marginBottom:10 }}>{patch.song.artist}</div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:12, color:T.muted, fontStyle:'italic', marginBottom:12, lineHeight:1.5 }}>"{patch.result.vibe}"</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                  {patch.chain.map((p,i)=>(
                    <span key={i} style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:PEDAL_CLR[p]||T.muted, background:`${PEDAL_CLR[p]||T.muted}18`, border:`1px solid ${PEDAL_CLR[p]||T.muted}44`, padding:'2px 8px', borderRadius:8 }}>{p}</span>
                  ))}
                </div>
                <button onClick={()=>loadPatch(patch)} style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#1A0F07', background:T.amber, border:'none', borderRadius:20, padding:'7px 18px', cursor:'pointer' }}>Load Patch</button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── SPOTIFY SCREEN ───────────────────────────────────────────────────────────

function SpotifyScreen({ spotifyQ, setSpotifyQ, spotifyRes, setSpotifyRes, spotifyLoad, setActiveSong, setScreen, myRig, showToast }) {
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!spotifyQ.trim() || loading) return;
    setLoading(true);
    setSpotifyRes([]);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const headers = { 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' };
      if (apiKey) headers['x-api-key'] = apiKey;
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers,
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          system:'Guitar music search. Return ONLY raw JSON array of 6 songs: [{title,artist,genre,bpm,key,tuning,match}]. Prioritize Indian music for relevant queries.',
          messages:[{role:'user',content:`Search for guitar songs: ${spotifyQ}`}],
          mcp_servers:[{type:'url',url:'https://mcp-gateway-external-pilot.spotify.net/mcp',name:'spotify'}],
        }),
      });
      const data = await res.json();
      const txt = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      const parsed = JSON.parse(txt.replace(/```json|```/g,'').trim());
      setSpotifyRes(Array.isArray(parsed)?parsed:[]);
    } catch {
      const q = spotifyQ.toLowerCase();
      setSpotifyRes(SONGS.filter(s=>s.title.toLowerCase().includes(q)||s.artist.toLowerCase().includes(q)||s.genre.toLowerCase().includes(q)));
    }
    setLoading(false);
  };

  const useResult = (result) => {
    const match = SONGS.find(s=>s.title.toLowerCase()===result.title?.toLowerCase()&&s.artist.toLowerCase()===result.artist?.toLowerCase());
    if (match) {
      setActiveSong(match);
      setScreen('analyze');
      showToast(`Loaded: ${match.title}`);
    } else {
      const newSong = {
        id: Date.now(), title:result.title||'Unknown', artist:result.artist||'Unknown',
        genre:result.genre||'Unknown', bpm:result.bpm||120, key:result.key||'C', tuning:result.tuning||'Standard',
        match:result.match||80, color:T.amber, ytId:'', spotifyId:'',
        idealGear:{ guitars:[], pickups:[], amps:[], models:[], cabs:[], fx:[] },
      };
      setActiveSong(newSong);
      setScreen('analyze');
      showToast(`Loaded: ${newSong.title}`);
    }
  };

  return (
    <div style={{ padding:'32px', animation:'fadeUp 0.3s ease', maxWidth:800 }}>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:28, color:T.cream, marginBottom:20 }}>Search for Songs</h2>
      <div style={{ display:'flex', gap:10, marginBottom:28 }}>
        <input value={spotifyQ} onChange={e=>setSpotifyQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search artist, song, or genre…" style={{ flex:1, background:T.raised, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 16px', color:T.cream, fontFamily:'DM Mono,monospace', fontSize:12, outline:'none' }}/>
        <button onClick={search} disabled={loading} style={{ fontFamily:'DM Serif Display,serif', fontSize:14, color:'#1A0F07', background:loading?T.raised:`linear-gradient(135deg,${T.amber},${T.orange})`, border:'none', borderRadius:12, padding:'12px 24px', cursor:loading?'default':'pointer' }}>
          {loading?'Searching…':'Search'}
        </button>
      </div>

      {spotifyRes.length===0&&!loading&&(
        <div>
          <SectionLabel>All Songs</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {SONGS.map(song=>(
              <SongCard key={song.id} song={song} active={false} myRig={myRig} onClick={()=>useResult(song)}/>
            ))}
          </div>
        </div>
      )}

      {spotifyRes.length>0&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
          {spotifyRes.map((result,i)=>(
            <div key={i} onClick={()=>useResult(result)} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:16, cursor:'pointer', transition:'all 0.2s' }}>
              <div style={{ fontFamily:'DM Serif Display,serif', fontSize:15, color:T.cream, marginBottom:4 }}>{result.title||'Unknown'}</div>
              <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:T.muted, marginBottom:8 }}>{result.artist||'Unknown'}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {result.genre&&<span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, background:T.raised, padding:'2px 6px', borderRadius:8 }}>{result.genre}</span>}
                {result.bpm&&<span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, background:T.raised, padding:'2px 6px', borderRadius:8 }}>{result.bpm} BPM</span>}
                {result.key&&<span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:T.muted, background:T.raised, padding:'2px 6px', borderRadius:8 }}>{result.key}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function ToneAI() {
  const [myRig,        setMyRigState] = useState({ ...EMPTY_RIG });
  const [screen,       setScreen]     = useState('home');
  const [sessionRig,   setSessionRig] = useState(null);
  const [activeSong,   setActiveSong] = useState(SONGS[0]);
  const [isAnalyzing,  setIsAnalyzing]= useState(false);
  const [analyzeStep,  setAnalyzeStep]= useState(0);
  const [aiResult,     setAiResult]   = useState(null);
  const [urlInput,     setUrlInput]   = useState('');
  const [chain,        setChain]      = useState(['COMP','DRIVE','AMP','DELAY','REVERB']);
  const [dragIdx,      setDragIdx]    = useState(null);
  const [eq,           setEq]         = useState({ gain:5, bass:6, middle:7, treble:6, presence:5, master:7 });
  const [genre,        setGenre]      = useState('All');
  const [savedPatches, setSaved]      = useState([]);
  const [toast,        setToast]      = useState({ msg:'', visible:false });
  const [spotifyQ,     setSpotifyQ]   = useState('');
  const [spotifyRes,   setSpotifyRes] = useState([]);
  const [spotifyLoad,  setSpotifyLoad]= useState(false);
  const [vinylSpin,    setVinylSpin]  = useState(false);

  const setMyRig = useCallback(rigOrFn => {
    setMyRigState(prev => typeof rigOrFn==='function' ? rigOrFn(prev) : rigOrFn);
  }, []);

  const activeRig = sessionRig || myRig;
  const rigMatch  = calcRigMatch(activeSong, activeRig);
  const gaps      = rigMatch!=null ? rigGaps(activeSong, activeRig) : [];

  const showToast = useCallback(msg => {
    setToast({ msg, visible:true });
    setTimeout(()=>setToast({ msg:'', visible:false }), 2500);
  }, []);

  const runAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzeStep(0);
    setAiResult(null);
    setVinylSpin(true);
    setScreen('analyze');

    try {
      await delay(700); setAnalyzeStep(1);
      await delay(700); setAnalyzeStep(2);

      const useRig = sessionRig || myRig;
      const gL  = RIG.guitarTypes.find(g=>g.id===useRig.guitarType)?.label || 'unknown guitar';
      const bL  = RIG.ampBrands.find(a=>a.id===useRig.ampBrand)?.label || '';
      const aL  = `${bL} ${useRig.ampModel||''}`.trim() || 'unknown amp';
      const pL  = RIG.pickupTypes.find(p=>p.id===useRig.pickup)?.label || 'unknown pickups';
      const cL  = RIG.cabinets.find(c=>c.id===useRig.cab)?.label || 'unknown cabinet';
      const fL  = (useRig.effects||[]).map(id=>RIG.effects.find(e=>e.id===id)?.label).filter(Boolean).join(', ');
      const rigCtx = `User rig: Guitar=${gL}, Pickups=${pL}, Amp=${aL}, Cabinet=${cL}, Effects: ${fL||'none'}.`;

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const headers = { 'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true' };
      if (apiKey) headers['x-api-key'] = apiKey;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers,
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1200,
          system:`You are ToneAI's expert guitar tone analyzer. Given a song and the user's specific rig, return ONLY raw JSON (no markdown fences):
{"match":number,"amp":"amp settings","overdrive":"overdrive settings","cabinet":"cabinet settings","delay":"delay settings","reverb":"reverb settings","gain":number,"bass":number,"middle":number,"treble":number,"presence":number,"master":number,"chain":["COMP","DRIVE","AMP","DELAY","REVERB"],"vibe":"one evocative sentence","rig_tips":["tip1","tip2"],"swap_suggestions":["suggestion1"]}
All numbers are 0-10. chain contains values from [COMP,DRIVE,AMP,DELAY,REVERB,WAH,CHORUS,PHASE,FUZZ].`,
          messages:[{ role:'user', content:`Song: "${activeSong.title}" by ${activeSong.artist}. ${rigCtx}` }],
        }),
      });

      setAnalyzeStep(3);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const txt = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      const parsed = JSON.parse(txt.replace(/```json|```/g,'').trim());
      setAiResult(parsed);
      if (parsed.chain?.length) setChain(parsed.chain);
      const eqKeys = ['gain','bass','middle','treble','presence','master'];
      if (eqKeys.every(k=>parsed[k]!=null)) setEq(Object.fromEntries(eqKeys.map(k=>[k,+parsed[k]])));
      showToast('Tone analysis complete!');
    } catch (err) {
      setAnalyzeStep(3);
      const fallback = {
        match: rigMatch||75,
        amp: 'Clean base tone, moderate break-up on channel 2',
        overdrive: 'Light drive, gain at 9 o\'clock position',
        cabinet: 'Open-back for natural spread and air',
        delay: '320ms slapback, 20% mix, 2 repeats',
        reverb: 'Small hall, 25% mix, moderate decay',
        gain:5.5, bass:6, middle:7, treble:6.5, presence:5, master:7,
        chain:['COMP','DRIVE','AMP','DELAY','REVERB'],
        vibe:'Warm, musical tone with natural compression and expressive dynamics.',
        rig_tips:['Keep gain under 6 for harmonic clarity and note separation','Boost mids slightly to cut through the mix without harshness','Use neck pickup for warmth, bridge for definition'],
        swap_suggestions:['A tube screamer in the drive slot adds mid-range push and warmth'],
      };
      setAiResult(fallback);
      setChain(fallback.chain);
      setEq({ gain:fallback.gain, bass:fallback.bass, middle:fallback.middle, treble:fallback.treble, presence:fallback.presence, master:fallback.master });
      showToast(import.meta.env.VITE_ANTHROPIC_API_KEY ? 'API error — showing demo result' : 'Demo mode — add VITE_ANTHROPIC_API_KEY for live analysis');
    }

    setIsAnalyzing(false);
    setVinylSpin(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyzing, activeSong, sessionRig, myRig, rigMatch, showToast]);

  const savePatch = useCallback(() => {
    if (!aiResult) return;
    setSaved(prev => [{ id:Date.now(), song:activeSong, rig:{...activeRig}, result:{...aiResult}, eq:{...eq}, chain:[...chain] }, ...prev]);
    showToast('Patch saved! ✦');
  }, [aiResult, activeSong, activeRig, eq, chain, showToast]);

  const screenProps = { myRig, setMyRig, screen, setScreen, sessionRig, setSessionRig, activeSong, setActiveSong, isAnalyzing, analyzeStep, aiResult, urlInput, setUrlInput, chain, setChain, dragIdx, setDragIdx, eq, setEq, genre, setGenre, savedPatches, setSaved, spotifyQ, setSpotifyQ, spotifyRes, setSpotifyRes, spotifyLoad, setSpotifyLoad, activeRig, rigMatch, gaps, runAnalyze, savePatch, showToast, vinylSpin };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.cream }}>
      <Nav screen={screen} setScreen={setScreen} myRig={myRig} runAnalyze={runAnalyze}/>
      <RigBanner myRig={myRig} activeSong={activeSong} onEdit={()=>setScreen('rig')}/>
      <NowPlayingBar activeSong={activeSong} vinylSpin={vinylSpin} rigMatch={rigMatch}/>
      {screen==='home'     && <HomeScreen     {...screenProps}/>}
      {screen==='rig'      && <RigScreen      rig={myRig} setMyRig={setMyRig} setScreen={setScreen} showToast={showToast}/>}
      {screen==='analyze'  && <AnalyzeScreen  {...screenProps}/>}
      {screen==='discover' && <DiscoverScreen {...screenProps}/>}
      {screen==='patches'  && <PatchesScreen  {...screenProps}/>}
      {screen==='spotify'  && <SpotifyScreen  {...screenProps}/>}
      <Toast msg={toast.msg} visible={toast.visible}/>
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

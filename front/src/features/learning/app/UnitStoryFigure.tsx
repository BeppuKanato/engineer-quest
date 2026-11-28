"use client";
import type { ReactNode } from "react";
import type { StoryKind } from "./unitStoryCopy";

const ink="#334155", blue="#2563eb", pale="#eef4fc", green="#15803d", orange="#d97706";
type Beat=0|1|2|3|4|5;
function Robot({x,y,question=false,done=false}:{x:number;y:number;question?:boolean;done?:boolean}) {
 return <g transform={`translate(${x} ${y})`}><line x1="18" y1="-7" x2="18" y2="-19" stroke={blue} strokeWidth="3"/><circle cx="18" cy="-20" r="4" fill={blue}/><rect width="38" height="32" rx="8" fill={blue}/><rect x="6" y="5" width="26" height="17" rx="4" fill="#dbeafe"/><circle cx="13" cy="12" r="2.5" fill={ink}/><circle cx="25" cy="12" r="2.5" fill={ink}/><path d={done?"M13 17 Q19 23 25 17":"M13 19 Q19 15 25 19"} stroke={ink} fill="none" strokeWidth="2"/>{question&&<g><circle cx="53" cy="-8" r="13" fill="white" stroke={blue} strokeWidth="2"/><text x="53" y="-3" textAnchor="middle" fontSize="17" fontWeight="bold" fill={blue}>?</text></g>}</g>;
}
function Flag({x,y}:{x:number;y:number}){return <g transform={`translate(${x} ${y})`}><path d="M0 27V0 L24 7 L0 15" stroke={orange} fill="#fbbf24" strokeWidth="3" strokeLinejoin="round"/></g>}
function Chest({x,y}:{x:number;y:number}){return <g transform={`translate(${x} ${y})`}><rect width="34" height="23" rx="3" fill="#b08968" stroke={ink}/><path d="M0 8h34M13 8v8h8V8" stroke={ink} fill="#fbbf24"/></g>}
function Note({x,y,children,width=110}:{x:number;y:number;children:ReactNode;width?:number}){return <g><rect x={x} y={y} width={width} height="25" rx="6" fill="white" stroke="#94a3b8"/><text x={x+width/2} y={y+17} fill={ink} fontSize="12" textAnchor="middle" fontWeight="700">{children}</text></g>}
function Person({x,y}:{x:number;y:number}){return <g transform={`translate(${x} ${y})`}><circle cx="18" cy="0" r="12" fill="#e6bd97" stroke={ink} strokeWidth="1.5"/><path d="M6 -3 Q10 -16 25 -12 L30 -2" fill="#475569"/><path d="M0 37V25 Q18 7 36 25V37Z" fill="#82a37d" stroke={ink} strokeWidth="1.5"/><path d="M30 24L54 12" stroke={ink} strokeWidth="3" strokeLinecap="round"/></g>}
const roadNodes=[{x:80,y:104},{x:162,y:53},{x:162,y:155},{x:260,y:53},{x:260,y:155},{x:354,y:104}];
const roads=[[0,1,2],[0,2,1],[1,3,2],[1,4,2],[2,4,5],[3,5,2],[4,5,5]] as const;
function RouteScene({kind,beat}:{kind:"bfs"|"dfs"|"dijkstra"|"astar";beat:Beat}){
 const weighted=kind==="dijkstra"||kind==="astar", rescue=kind==="astar", dfs=kind==="dfs";
 const active=beat===1?dfs?[0,2,0,2]:rescue?[]:weighted?[0,2,4,5]:[0,2,4,1,3,5]:[];
 const path=active.map(i=>roadNodes[i]).map(p=>`${p.x},${p.y}`).join(" ");
 return <>
  <rect x="8" y="25" width="444" height="177" rx="12" fill={rescue?"#dce9e6":dfs?"#dbe3ef":"#e5e7eb"}/>
  {rescue&&<g fill="#9ab5a1"><path d="M18 45l23 -21 24 21z M380 48l20 -22 20 22z M388 180l20 -26 20 26z"/><path d="M98 28Q125 75 113 185" stroke="#91b6da" strokeWidth="8" fill="none"/></g>}
  {roads.map(([a,b,w],i)=>{const p=roadNodes[a],q=roadNodes[b];return <g key={i}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={weighted&&w===5?"#b08968":"#94a3b8"} strokeWidth="15" strokeLinecap="round"/><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#f8fafc" strokeDasharray="5 6" strokeWidth="2"/>{weighted&&<g><rect x={(p.x+q.x)/2-11} y={(p.y+q.y)/2-9} width="22" height="18" rx="4" fill="#fff" stroke="#94a3b8"/><text x={(p.x+q.x)/2} y={(p.y+q.y)/2+4} fontSize="12" fill={ink} fontWeight="bold" textAnchor="middle">{w}</text></g>}</g>})}
  {beat===1&&<polyline points={path} fill="none" stroke={orange} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dfs?"5 3":undefined}/>}
  {rescue&&beat===1&&<g fill="none" stroke={orange} strokeWidth="2">{[1,2,3,4].map(i=><circle key={i} cx={roadNodes[i].x} cy={roadNodes[i].y} r="22" strokeDasharray="4 3"/>)}</g>}
  {roadNodes.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="12" fill={beat===5&&dfs?"#dcfce7":"white"} stroke={beat===5&&dfs?green:ink} strokeWidth="2"/><text x={p.x} y={p.y+4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={ink}>{String.fromCharCode(65+i)}</text>{dfs&&i!==0&&i!==5&&beat!==5&&<text x={p.x+12} y={p.y-15} fontSize="15" fill={orange}>?</text>}</g>)}
  {dfs?<><Chest x={368} y={74}/><Chest x={114} y={140}/></>:<Flag x={374} y={81}/>}
  {rescue?<g transform="translate(32 98)"><path d="M0 0h40M4 -15h32M4 15h32M4 -15v30M36 -15v30" stroke={blue} strokeWidth="4"/><rect x="12" y="-8" width="16" height="16" rx="4" fill={blue}/><rect x="13" y="10" width="14" height="10" fill="#b08968"/></g>:<><Robot x={15} y={113} question={beat===4} done={beat===5}/>{kind!=="dfs"&&<rect x="23" y="150" width="23" height="19" rx="2" fill="#b08968" stroke={ink}/>}</>}
  {beat===0&&<Note x={120} y={4} width={220}>{rescue?"救助地点へ物資を届けたい":dfs?"宝を全部見つけたい":weighted?"通路ごとに消費量が違う":"届け先までの道を探す"}</Note>}
  {beat===1&&<Note x={110} y={178} width={240}>{rescue?"確認する場所が増えていく":dfs?"同じ場所を往復…":weighted?"遠回りでも消費が少ないことがある":"余分な道を通ってしまう"}</Note>}
  {beat===2&&<Note x={105} y={5} width={250}>{rescue?"移動時間は最小・探索の負担は小さく":dfs?"すべての場所を見落とさない":weighted?"消費エネルギーを最小に":"通る道の本数を最小に"}</Note>}
  {beat===3&&<><Person x={18} y={30}/>{rescue?<line x1="162" y1="155" x2="354" y2="104" stroke={blue} strokeWidth="3" strokeDasharray="6 5"/>:<Note x={175} y={4} width={190}>{dfs?"訪問済みの記録":weighted?"通った道の消費量を比較":"いくつかの行き方を比較"}</Note>}{dfs&&[0,2].map(i=><text key={i} x={roadNodes[i].x+15} y={roadNodes[i].y+18} fontSize="18" fill={green}>✓</text>)}</>}
  {beat===4&&<><Note x={136} y={5} width={190}>{rescue?"見積もりをどう使う？":dfs?"次はどこを調べる？":"どの場所を選ぶ？"}</Note><circle cx="162" cy="53" r="19" stroke={blue} strokeDasharray="4 4" strokeWidth="2" fill="none"/><circle cx="162" cy="155" r="19" stroke={blue} strokeDasharray="4 4" strokeWidth="2" fill="none"/></>}
  {beat===5&&<Note x={100} y={5} width={260}>{dfs?"宝の数と訪問順を記録":rescue?"最短経路の計画を完成":weighted?"消費が最小の経路を計画":"各届け先までの最短距離"}</Note>}
 </>;
}
function ShelfScene({beat}:{beat:Beat}){
 const values=[3,7,12,19,25,31,42,50,58,66];return <>
 <rect x="18" y="127" width="424" height="9" rx="3" fill="#8a6a52"/>{values.map((n,i)=><g key={n}><rect x={24+i*43} y={64+(i%3)*8} width="38" height={63-(i%3)*8} rx="4" fill={beat===5&&n===58?"#15803d":["#7d8ca3","#a98a6d","#82a37d"][i%3]} opacity={beat===1&&i<6?.5:1}/><text x={43+i*43} y="109" fill="white" textAnchor="middle" fontWeight="bold" fontSize="16">{n}</text></g>)}
 <Note x={160} y={12} width={140}>注文：58番の商品</Note>
 {beat===1&&<><path d="M42 45H363l-10 -6m10 6l-10 6" fill="none" stroke={orange} strokeWidth="4"/><Note x={150} y={167} width={210}>一つずつ確認するのは大変</Note></>}
 {beat===2&&<Note x={120} y={168} width={220}>番号順を活かして確認を減らす</Note>}
 {beat===3&&<><Person x={35} y={155}/><path d="M90 163 Q230 120 383 145" stroke={blue} fill="none" strokeDasharray="5 5" strokeWidth="3"/><Note x={150} y={167} width={225}>ありそうな場所に当たりをつける</Note></>}
 {beat===4&&<><Robot x={20} y={164} question/><Note x={137} y={167} width={210}>次に確かめる番号は？</Note></>}
 {beat===5&&<><Robot x={25} y={163} done/><Note x={151} y={167} width={185}>目的の商品が見つかった！</Note></>}
 </>;
}
const mazeRows=["1111111","1000101","1010101","1010001","1011101","1000001","1111111"];
function MazeTile({x,y,size=17,variant=0}:{x:number;y:number;size?:number;variant?:number}){
 return <g>{mazeRows.map((r,j)=>[...r].map((cell,i)=><rect key={i+":"+j} x={x+i*size} y={y+j*size} width={size} height={size} fill={(variant===1?mazeRows[i][j]:cell)==="1"?"#5b7186":"#f8fafc"} stroke="#dbe3ef" strokeWidth=".5"/>))}</g>;
}
function MazeScene({kind,beat}:{kind:"maze-digging"|"wall-extension";beat:Beat}){
 const digging=kind==="maze-digging";
 return <>
 {beat===1&&digging?<><MazeTile x={65} y={45}/><MazeTile x={270} y={45}/><Note x={145} y={6} width={170}>また同じ迷路…</Note></>:beat===1?<><rect x="58" y="35" width="344" height="139" rx="5" fill="#fff" stroke={ink} strokeWidth="6"/><rect x="215" y="35" width="12" height="139" fill="#5b7186"/><rect x="227" y="35" width="175" height="139" fill="#fecaca" opacity=".6"/><text x="314" y="109" fontSize="17" textAnchor="middle" fill="#991b1b">通れない</text></>:beat===2||beat===5?<><MazeTile x={56} y={42} size={18}/><MazeTile x={272} y={42} size={18} variant={1}/><Note x={177} y={7} width={106}>違う迷路</Note>{beat===5&&<text x="230" y="115" fontSize="30" fontWeight="bold" textAnchor="middle" fill={green}>✓</text>}</>:<><rect x="115" y="28" width="310" height="151" rx="7" fill={digging?"#a98a6d":"white"} stroke={ink} strokeWidth="3"/>{digging?<><path d="M115 149H178V75H252" stroke="#f8fafc" strokeWidth="25" strokeLinejoin="round" fill="none"/><path d="M252 75h53m-53 0v65" stroke={beat===4?orange:blue} strokeWidth="3" strokeDasharray="5 5"/>{beat===4&&<text x="296" y="72" fontSize="22" fill={orange}>?</text>}</>:<>{[152,210,268,326,384].flatMap(x=>[58,105,152].map(y=><rect key={x+":"+y} x={x-7} y={y-7} width="14" height="14" rx="2" fill="#5b7186"/>))}<path d="M152 58H210V105" fill="none" stroke="#5b7186" strokeWidth="11"/><path d="M268 105h58m-58 0V58m0 47v47" stroke={beat===4?orange:blue} strokeWidth="3" strokeDasharray="5 5"/></>}</>}
 {beat===3?<Person x={23} y={125}/>:<Robot x={19} y={155} question={beat===4} done={beat===5}/>}
 {beat===3&&<Note x={135} y={183} width={235}>{digging?"通路で部屋がつながるか考える":"壁で通路をふさがないか考える"}</Note>}
 {beat===4&&<Note x={127} y={183} width={235}>{digging?"どこを掘ってよい？":"どの方向に壁を伸ばす？"}</Note>}
 {beat===5&&<Note x={140} y={179} width={180}>自分のコードで迷路を作る</Note>}
 </>;
}
function Coin({x,y,value,r=16}:{x:number;y:number;value:number;r?:number}){return <g><circle cx={x} cy={y} r={r} fill={value===500?"#e6c875":value===10?"#b08968":"#cbd5e1"} stroke="#64748b" strokeWidth="1.5"/><text x={x} y={y+4} textAnchor="middle" fontSize={r<13?9:13} fontWeight="bold" fill={ink}>{value}</text></g>}
function CoinsScene({beat}:{beat:Beat}){
 return <><rect x="12" y="145" width="436" height="50" rx="6" fill="#a98a6d"/><rect x="22" y="20" width="125" height="62" rx="8" fill="#475569"/><rect x="32" y="30" width="105" height="42" rx="4" fill="#dcfce7"/><text x="84" y="57" textAnchor="middle" fontSize="17" fontWeight="bold" fill={ink}>お釣り 786円</text>
 {beat===1||beat===3?<>{beat===3&&<Note x={170} y={7} width={170}>500円分を比較</Note>}{Array.from({length:24},(_,i)=><Coin key={i} x={183+(i%8)*22} y={45+Math.floor(i/8)*20} value={1} r={10}/>)}<Note x={175} y={109} width={177}>{beat===1?"1円玉 × 786枚":"1円玉 × 500枚"}</Note>{beat===3&&<><Coin x={402} y={83} value={500} r={24}/><text x="401" y="123" textAnchor="middle" fontSize="12" fontWeight="bold">1枚</text></>}</>:beat===2||beat===5?<><path d="M200 63h118l-10 66H210Z" fill="#fff" stroke={ink} strokeWidth="2"/><rect x="220" y="78" width="78" height="29" rx="6" fill="#dcfce7"/><text x="259" y="98" textAnchor="middle" fontSize="15" fontWeight="bold" fill={green}>786円</text><Note x={172} y={130} width={195}>{beat===5?"お釣りの用意ができた":"同じ金額・少ない枚数"}</Note></>:<>{[500,100,50,10,5,1].map((v,i)=><Coin key={v} x={170+(i%3)*88} y={42+Math.floor(i/3)*63} value={v} r={21}/>)}<Note x={174} y={127} width={220}>どの硬貨を使う？</Note></>}
 {beat===3?<Person x={24} y={155}/>:<Robot x={31} y={158} question={beat===4} done={beat===5}/>}
 </>;
}
export function UnitStoryFigure({kind,beat,label,thumbnail=false}:{kind:StoryKind;beat:Beat;label:string;thumbnail?:boolean}){
 return <svg viewBox="0 0 460 210" width="100%" height="100%" preserveAspectRatio={thumbnail?"xMidYMid slice":"xMidYMid meet"} role="img" aria-label={label} style={{display:"block",background:pale}}>
 <rect width="460" height="210" fill={pale}/>
 {kind==="binary-search"?<ShelfScene beat={beat}/>:kind==="maze-digging"||kind==="wall-extension"?<MazeScene kind={kind} beat={beat}/>:kind==="greedy-coins"?<CoinsScene beat={beat}/>:<RouteScene kind={kind} beat={beat}/>}
 </svg>;
}

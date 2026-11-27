import type { PythonTestCase } from "../../../lib/pyodideRunner";
import { weightedNodes, weightedEdges, weightedHeuristic, type WeightedSearchMode } from "../graphs/weightedSearch";
import { weightedMaterials } from "./content";
type Graph=Record<string, [string, number][]>;
type WeightedTest=PythonTestCase & {visibility:"display"|"judgement"; graph:Graph; start:string; goal:string; cost:number|null};
function graphOf(ids: readonly string[], edges:readonly (readonly [string,string,number])[]):Graph {
  const graph:Graph=Object.fromEntries(ids.map(id=>[id,[]]));
  for(const [u,v,w] of edges){graph[u].push([v,w]);graph[v].push([u,w]);}
  return graph;
}
const main=graphOf(weightedNodes.map(n=>n.id),weightedEdges.map(e=>[e.from,e.to,e.weight] as const));
const transfer=graphOf(["S","X","Y","T"],[["S","X",8],["S","Y",2],["Y","X",2],["X","T",3],["Y","T",10]]);
const zero=graphOf(["S","A","B","T"],[["S","A",0],["S","B",2],["A","B",1],["B","T",3]]);
const tie=graphOf(["S","A","B","T"],[["S","A",1],["S","B",1],["A","T",2],["B","T",2]]);
export function weightedTests(mode:WeightedSearchMode): WeightedTest[] {
  const test=(id:string,label:string,visibility:WeightedTest["visibility"],graph:Graph,start:string,goal:string,cost:number|null,path:string[],heuristic?:Record<string,number>):WeightedTest=>({
    id,label,visibility,graph,start,goal,cost,functionName:mode,args:[graph,start,goal,...(mode==="astar"?[heuristic??Object.fromEntries(Object.keys(graph).map(id=>[id,0]))]:[])],expected:[cost,path],
  });
  return [
    test("D1","基本のグラフ","display",main,"A","F",6,["A","B","D","F"],weightedHeuristic),
    test("D2","別のグラフ","display",transfer,"S","T",7,["S","Y","X","T"],{S:4,X:2,Y:3,T:0}),
    test("J1","到達できない場合","judgement",graphOf(["S","T"],[]),"S","T",null,[]),
    test("J2","開始点とゴールが同じ場合","judgement",graphOf(["S"],[]),"S","S",0,["S"]),
    test("J3","重みが0の辺と距離の再更新","judgement",zero,"S","T",4,["S","A","B","T"]),
    test("J4","同じ最小コストの経路","judgement",tie,"S","T",3,["S","A","T"]),
    test("J5","開始点とゴールを変更した場合","judgement",main,"C","D",5,["C","A","B","D"]),
  ];
}
/** 期待経路の文字列一致ではなく、経路の辺・合計と最適コストを照合する。 */
export function validWeightedResult(test: WeightedTest, actual:unknown):boolean {
  if(!Array.isArray(actual)||actual.length!==2||actual[0]!==test.cost||!Array.isArray(actual[1])) return false;
  const path=actual[1];
  if(test.cost===null)return path.length===0;
  if(path[0]!==test.start||path[path.length-1]!==test.goal||new Set(path).size!==path.length||path.some(p=>typeof p!=="string"||!(p in test.graph)))return false;
  let total=0;
  for(let i=1;i<path.length;i++){const edge=test.graph[path[i-1]].find(([node])=>node===path[i]);if(!edge)return false;total+=edge[1];}
  return total===test.cost;
}
export function weightedTemplates(mode:WeightedSearchMode) {
  const lines=weightedMaterials[mode].code.lines;
  const replace=(ids:readonly string[])=>lines.map(line=>ids.includes(line.id)?line.text.match(/^ */)![0]+"raise NotImplementedError # ここを書く":line.text).join("\n");
  return {full:lines[0].text+"\n    raise NotImplementedError # ここを書く\n",skeleton:replace(["select-min","candidate","update-distance","update-parent","add-frontier","reconstruct"]), "fill-in":replace(["select-min","update-distance","update-parent"])};
}
export const weightedReferenceCode=(mode:WeightedSearchMode)=>weightedMaterials[mode].code.lines.map(line=>line.text).join("\n");

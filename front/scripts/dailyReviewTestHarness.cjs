const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../src');
function loader(stubs={}){
 const cache=new Map();
 function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
  const mod={exports:{}};cache.set(file,mod);
  const localRequire=name=>{
   if(name in stubs)return stubs[name];
   if(name.startsWith('@/')||name.startsWith('.')){
    const base=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
    const target=[base,base+'.ts',base+'.tsx',base+'.json'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
    if(target)return target.endsWith('.json')?JSON.parse(fs.readFileSync(target,'utf8')):load(target);
   }
   return require(name);
  };
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',js)(localRequire,mod,mod.exports);return mod.exports;
 }
 return load;
}
module.exports={loader,root,React,renderToStaticMarkup};

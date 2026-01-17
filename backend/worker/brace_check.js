const fs=require('fs');
const s=fs.readFileSync('src/index.ts','utf8');

let line=1,col=0;
const stack=[];
let inStr=null,esc=false,inLine=false,inBlock=false;

const ctx=(pos)=>{
  const a=Math.max(0,pos-30), b=Math.min(s.length,pos+30);
  return s.slice(a,b).replace(/\n/g,'\\n');
};

for(let i=0;i<s.length;i++){
  const ch=s[i]; col++;

  if(ch==='\n'){ line++; col=0; inLine=false; continue; }

  if(inBlock){
    if(ch==='*' && s[i+1]==='/'){ inBlock=false; i++; col++; }
    continue;
  }
  if(inLine) continue;

  if(inStr){
    if(!esc && ch===inStr) inStr=null;
    esc = (!esc && ch==='\\');
    continue;
  } else esc=false;

  if(ch==='/' && s[i+1]==='/'){ inLine=true; i++; col++; continue; }
  if(ch==='/' && s[i+1]==='*'){ inBlock=true; i++; col++; continue; }

  if(ch==='\"' || ch===\"'\" || ch===''){ inStr=ch; continue; }

  if(ch==='{') stack.push({line,col,pos:i,ctx:ctx(i)});
  else if(ch==='}'){
    if(!stack.length){ console.log('Extra } at', line+':'+col); process.exit(0); }
    stack.pop();
  }
}

console.log('Unclosed { count:', stack.length);
console.log('Last unclosed braces:');
stack.slice(-5).forEach(x=>console.log('- { opened at '+x.line+':'+x.col+' ctx=\"...'+x.ctx+'...\"'));

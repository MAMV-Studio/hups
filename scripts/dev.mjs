import {spawn} from 'node:child_process';
const args=process.argv.slice(2).flatMap(arg=>arg==='--strictPort'?[]:[arg==='--host'?'--hostname':arg]);
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack',...args],{stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));

import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function checkBranch({eventName,branch,head,base,sameRepository=true}){
 const topic=/^(feature|hotfix)\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
 if(eventName==='pull_request'){
  if(base==='develop' && (topic.test(head)||head==='main'))return true;
  if(base==='main' && sameRepository && (head==='develop'||/^hotfix\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/.test(head)))return true;
  throw new Error('PR phải đi feature/* → develop → main. hotfix/* → main rồi đồng bộ main → develop.');
 }
 if(eventName==='push' && (['main','develop'].includes(branch)||topic.test(branch)))return true;
 if(eventName==='workflow_dispatch' && ['main','develop'].includes(branch))return true;
 throw new Error('Tên nhánh hợp lệ: main, develop, feature/ten-chuc-nang hoặc hotfix/ten-loi.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const event=process.env.GITHUB_EVENT_PATH?JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')):{};
  checkBranch({eventName:process.env.GITHUB_EVENT_NAME,branch:process.env.GITHUB_REF_NAME,head:event.pull_request?.head?.ref,base:event.pull_request?.base?.ref,sameRepository:event.pull_request?.head?.repo?.full_name===event.pull_request?.base?.repo?.full_name});
  console.log('Branch policy passed.');
 }catch(error){console.error(error.message);process.exitCode=1;}
}

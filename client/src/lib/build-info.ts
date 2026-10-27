import {useEffect,useState} from 'react';
import {appVersionLabel,loadReleaseReceipt,type ApplicationBuild} from './application-version';
declare const __FITCIRCLE_BUILD__: ApplicationBuild;
export const buildInfo=__FITCIRCLE_BUILD__;
export const versionLabel=appVersionLabel(buildInfo);
let receiptPromise:Promise<ApplicationBuild>|undefined;
export function useApplicationVersion(){
 const [build,setBuild]=useState(buildInfo);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{receiptPromise??=loadReleaseReceipt(buildInfo);void receiptPromise.then(value=>{if(active)setBuild(value);if(value.stage!=='published')receiptPromise=undefined;});};
  refresh();window.addEventListener('online',refresh);
  return()=>{active=false;window.removeEventListener('online',refresh);};
 },[]);
 return build;
}

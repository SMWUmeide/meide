import { useEffect, useState } from 'react';
export type CompanionActivity = { id: string; message: string };
export function CompanionNotice({ activity }: { activity: CompanionActivity | null }) {
  const [dismissed,setDismissed]=useState('');
  useEffect(()=>{if(!activity)return;const timer=setTimeout(()=>setDismissed(activity.id),4000);return()=>clearTimeout(timer);},[activity]);
  if(!activity || activity.id===dismissed)return null;
  return <aside key={activity.id} className="companion-notice t-label-md" role="status" aria-live="polite"><p title={activity.message}>{activity.message}</p></aside>;
}

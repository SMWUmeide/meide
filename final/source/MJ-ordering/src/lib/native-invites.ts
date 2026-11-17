import { App as NativeApp } from '@capacitor/app';
import { inviteToken } from './invite-url';

// Register before checking the cold-launch URL so a newer foreground intent wins.
export function listenForNativeInvites(onInvite: (token: string) => void) {
  let disposed = false, receivedEvent = false;
  const receive = (url?: string) => {
    if (disposed || !url) return;
    const token = inviteToken(url);
    if (token) onInvite(token);
  };
  const listener = NativeApp.addListener('appUrlOpen', event => { receivedEvent = true; receive(event.url); });
  void listener.then(async () => {
    const launch = await NativeApp.getLaunchUrl();
    if (!receivedEvent) receive(launch?.url);
  }).catch(() => { /* Manual web invitation links remain available. */ });
  return () => { disposed = true; void listener.then(handle => handle.remove()).catch(() => {}); };
}

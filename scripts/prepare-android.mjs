import { URL } from "node:url";
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { loadEnv } from 'vite';

const release = process.argv.includes('--release');
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
if (release) {
  if (!env.MEIDE_APPLICATION_ID || env.MEIDE_APPLICATION_ID === 'app.meide.preview' || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(env.MEIDE_APPLICATION_ID)) throw new Error('MEIDE_APPLICATION_ID에 확정된 앱 ID를 설정해 주세요.');
  let url;
  try { url = new URL(env.VITE_API_BASE_URL); } catch { throw new Error('VITE_API_BASE_URL에 출시용 HTTPS API 주소를 설정해 주세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('출시용 HTTPS API 주소를 확인해 주세요.');
}
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run('npm', ['run', 'build']);
if (release) writeFileSync('dist/native-release.json', JSON.stringify({ applicationId: env.MEIDE_APPLICATION_ID, apiOrigin: new URL(env.VITE_API_BASE_URL).origin }));
run('npx', ['cap', 'sync', 'android']);
console.log(release ? '출시용 웹 코드 동기화 완료. Android Studio에서 같은 앱 ID 설정과 서명으로 AAB를 빌드해 주세요.' : '개발용 Android 프로젝트 동기화 완료.');

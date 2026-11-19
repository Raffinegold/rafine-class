/**
 * SPA 새로고침 대응: GitHub Pages 는 없는 경로 요청에 404.html 을 돌려준다.
 * index.html 을 그대로 404.html 로 복사해 두면 /r/:token 같은 딥링크에서도
 * 주소는 유지된 채 앱이 뜨고, React Router 가(base 기준) 해당 경로를 렌더한다.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const src = resolve(dist, 'index.html');
const dst = resolve(dist, '404.html');

if (!existsSync(src)) {
  console.error('dist/index.html 이 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

copyFileSync(src, dst);
console.log('dist/404.html 생성 완료 (SPA 딥링크 대응)');

# GitHub Actions 자동 배포로 바꾸고 싶을 때

이 저장소는 지금 **`gh-pages` 브랜치 배포**로 동작합니다(아래 README 「GitHub Pages 배포」 참고).
푸시할 때마다 자동으로 빌드·배포되게 하려면 Actions 워크플로를 한 번만 추가하면 됩니다.

> Pickle(GitHub App) 연결 권한에는 `workflows` 권한이 없어서 워크플로 파일은 앱으로 푸시할 수 없습니다.
> (`refusing to allow a GitHub App to create or update workflow ... without workflows permission`)
> 그래서 이 파일은 `docs/` 에 보관해 두고, 필요할 때 GitHub 웹에서 직접 추가합니다.

## 추가 방법

1. GitHub 저장소에서 **Add file → Create new file**
2. 파일 이름: `.github/workflows/deploy.yml`
3. 아래 내용을 붙여넣고 **Commit changes**
4. 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 변경

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          # 저장소 이름이 곧 Pages 하위 경로가 됩니다 (예: /raffine-voca-app/)
          VITE_BASE: /${{ github.event.repository.name }}/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

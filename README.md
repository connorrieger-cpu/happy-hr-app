# Happy HR

Hyper-local happy hours and daily specials, starting with Ossington in Toronto. One backend, two apps.

| Folder | What |
| --- | --- |
| [`web/`](web) | The web app (React + TypeScript + Vite), and the API it's hosted with (Cloudflare Pages Functions + D1). Live at https://happy-hr-beta.pages.dev. See [web/README.md](web/README.md). |
| [`ios/`](ios) | The iPhone app (SwiftUI, iOS 26, Liquid Glass) and `HappyHRCore`, the shared Swift logic. See [ios/README.md](ios/README.md). |
| [`shared/api/`](shared/api) | The API contract both apps use (OpenAPI 3.1). |
| [`shared/fixtures/`](shared/fixtures) | Golden test cases computed by the web app's logic; the Swift port is tested against them. Regenerate with `npm run shared` in `web/`. |
| [`shared/design/`](shared/design) | Design tokens shared by both apps. |
| [`reports/`](reports), [`research_notes/`](research_notes) | The deal research behind the data. |

The deal data lives in `web/src/data/` and is served to iOS by `GET /api/venues`, so deploying the web app updates both.

## Moving to the Mac

1. Unzip `happy-hr.zip` wherever you keep projects (double-clicking it is fine).
2. Leave `happy-hr-secrets.zip` in Downloads: the setup script finds it and puts the Google Maps key and owner password in place (`web/.env.local`, `web/.dev.vars`).
3. In Terminal, in the `happy-hr` folder: `bash setup-mac.sh`.
4. Open Claude Code in that folder. [CLAUDE.md](CLAUDE.md) gives it the full context; the first job is getting `ios/HappyHR` to compile.

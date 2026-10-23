# Local OpenAI setup

Updated October 23, 2026. Main checkout: `/Users/miguelalvarado/Coding/soulfire`. The user entered an existing authorized key in `.env.local` and approved a paid synthetic smoke check. The local production server reports configured:true, and one real text-generation request succeeded. The file is ignored/untracked with mode 0600; the tracked example has a blank key. No secret is included in this report or repository.

| Purpose | Server environment variable | Current code default |
|---|---|---|
| Provider credential for all three modes | `OPENAI_API_KEY` | Required; no default |
| Text personalization/conversation | `OPENAI_MODEL` | `gpt-4.1-mini` |
| Recorded dictation and Realtime input transcription | `OPENAI_TRANSCRIBE_MODEL` | `gpt-4o-mini-transcribe` |
| WebRTC live speech | `OPENAI_REALTIME_MODEL` | `gpt-realtime`; output voice `marin` in code |

The same existing authorized OpenAI API key is used by all three server routes. Text-model access was verified with one synthetic request. Dictation and Realtime access are not yet verified. No Suno key is needed: the music is already stored locally.

## Smallest local setup route

The user enters the key directly into a local editor, never into chat, the browser, a command argument, a screenshot, or a committed file. `code` and `nano` are installed on this Mac. After explicit authorization to prepare/configure the local environment, the user can use:

```sh
cd /Users/miguelalvarado/Coding/soulfire
umask 077
cp -n .env.example .env.local
chmod 600 .env.local
nano .env.local
```

Enter the existing key after `OPENAI_API_KEY=` inside the editor. Keep or omit the optional model overrides. Save the file and restart the local development server in its Terminal window (`Ctrl-C`, then `npm run dev`). The file must be in the authoritative running project. Keep credentials out of temporary copies, source archives and Git.

The user already completed local key entry and authorized the current check. These instructions are for reproducing setup on another authorized machine; do not create new credentials or change billing implicitly. Provider calls consume the existing account's usage, so authorize the live check as part of setup. Microphone permission remains a separate explicit browser/OS decision when the user chooses Dictate or Live voice. Text can be tested without microphone permission.

## Existing safeguards verified in source

- All provider calls use the server helper `src/lib/server.ts`; `OPENAI_API_KEY` is read only there and sent as an Authorization header to `https://api.openai.com/v1/...`.
- The client calls localhost routes. `/api/status` returns only a configured boolean. Realtime returns SDP, not the API key.
- No `NEXT_PUBLIC_` credential variable. `.gitignore` excludes `.env*` except the empty `.env.example`. Snapshot creation explicitly excludes real env files.
- Localhost/same-origin checks, bounded inputs, a per-process request limit, timeouts, sanitized errors, and no-store response headers are present.
- Text Responses uses `store:false`; this is not a guarantee of zero provider retention.
- No API credential values are written to application logs by these routes. No value was printed or copied into this report.

The setup indicator alone proves only that a server variable exists. The separate live text smoke test verified a real validated response and UI render. Cloud transcription, WebRTC and physical voice remain untested. See live-ai-validation.md.

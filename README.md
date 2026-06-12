# Cantopop Map

A map of cantopop music video locations!

To add a location update `./src/app/common/locations.ts` then submit a PR.

Alternatively, you can submit an issue with the location information or email me at [devon@langpal.com.hk](mailto:devon@langpal.com.hk)!

多謝！

## Local HTTPS Development

1. Install [`mkcert`](https://github.com/FiloSottile/mkcert#installation) and run `mkcert -install` once to trust its certificate authority.
2. Generate certificates in the project root:
   ```bash
   mkdir -p .ssl
   mkcert -key-file .ssl/localhost-key.pem -cert-file .ssl/localhost.pem localhost 127.0.0.1 ::1
   ```
3. Start the HTTPS dev server:
   ```bash
   pnpm dev:https
   ```
   The script also works with `npm run dev:https` or `bun run dev:https`.

Environment variables `LOCAL_SSL_KEY`, `LOCAL_SSL_CERT`, and `LOCAL_SSL_CA` can override the default `.ssl` paths if you prefer to store certificates elsewhere.

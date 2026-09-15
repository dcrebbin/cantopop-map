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

## Updating YouTube view counts

Run the updater without an API key:

```bash
npm run views:update
```

The default provider uses the bundled `./modules/yt-dlp` executable to retrieve each video's view count and uploader channel ID, then reads the uploader channel's exact subscriber count from YouTube's structured channel data. Each location stores its video's uploader channel ID and subscriber count so feed eligibility is video-specific. It uses three throttled workers, checkpoints after every 10 videos, and only rewrites the locations file after every video and channel resolves successfully.

Uploader relationships are generated as `ARTIST_TO_YOUTUBE_CHANNEL_IDS`, with subscriber totals stored once per channel in `YOUTUBE_CHANNEL_SUBSCRIBER_COUNTS`. Artists can have multiple channel IDs because their videos may be published by different channels.

Direct watch-page scraping is also available as a fallback. It retrieves view counts but not channel subscriber counts:

```bash
npm run views:update -- --provider scrape
```

Both providers use small sequential batches with delays to reduce the likelihood of YouTube rate limiting. Run either command with `--help` to see tuning and cookie options.

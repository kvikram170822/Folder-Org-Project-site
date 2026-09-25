# Intelligent Explorer — beta site

Public, invite-gated landing + download page for the Intelligent Explorer private beta.
The app's source repository stays private; this site only hosts the mirror installers and
the page itself.

- `index.html` / `styles.css` / `app.js` — the page (static, GitHub Pages).
- `codes.js` — SHA-256 digests of currently-valid invite codes (public; not reverse-derivable).
- `_private/codes.txt` — the plaintext codes (gitignored, stay local).
- `assets/` — mirrored installers (gitignored binaries; regenerate `releases.json` after each mirror).

## Rotating invite codes

Run the generator to mint a new set and publish the fresh digests:

```
node tools/gen_codes.js <count> <site-root>
```

Commit the regenerated `codes.js`. Old codes stop working the moment it deploys.
Plaintext codes are written to `_private/codes.txt` — keep them safe and share privately.

## Mirrors

Copied from the private repo's GitHub Release assets into `assets/`, then
`releases.json` is regenerated with `name`, `platform`, `size`, and `url`.

## Site

`index.html` validates a code locally (SHA-256 vs `codes.js`) with no backend, then
unlocks the download list from `releases.json`. Works fully client-side.
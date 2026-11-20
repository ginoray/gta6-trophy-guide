[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ginoray/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ginoray/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

Open `app/index.html` in a browser (or serve `app/` with any static file server) — it works fully offline and loads nothing from the network.

## What it does

- **Tracker** — every trophy with its official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze; 1,350 points in total), earned checkboxes, and counters for trophies PlayStation tracks by a count. Progress is saved in the browser (localStorage) and can be exported to a JSON file, imported back, or shared as a link.
- **Filters** — by kind (story, missable, collectibles, activities, online), by grade, by earned state, plus text search.
- **Spoiler setting** — hides the names and descriptions of the 28 hidden trophies until they are earned.
- **Roadmap to the platinum** — five stages built from the official trophy descriptions, with every missable trophy flagged and its point of no return named. Research found exactly one missable trophy: *Positive Mental Attitude* in Chapter 1.
- **Guides with sources** — each trophy carries a guide in our own words (what to do, where and how, and when it can be missed) with its sources cited beside it: PowerPyx's trophy guide and roadmap, GTABase's trophy list, Push Square's guide, and GTA Spotter's list collected via PSNProfiles. Official names and descriptions are as PlayStation publishes them, via Exophase and PSNProfiles.

## Layout

- `app/` — the guide itself: plain static files (`index.html`, `style.css`, `app.js`) with the trophy data in `app/data/trophies.json`. No build step.
- `screenshots/` — screenshots of the app, stored as base64 text (`.b64`) and decoded by `main.ts` when the entry is handed in.
- `main.ts` — the hand-in program (Node 22, standard library only): validates the trophy data, copies `app/` and the decoded screenshots to the output directory, and writes the dossier with the vendored make.fun library in `vendor/`.
- `serve.ts` — a tiny local server for trying the guide: `node serve.ts`, then open http://localhost:8080.

## License

MIT — see `LICENSE`.

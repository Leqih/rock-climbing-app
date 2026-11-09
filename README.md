# chalk. prototype

Clickable prototype of chalk., an indoor bouldering app for beginners (DTX 495, UIUC).
Every screen follows a step of the user flow ("Flow chart v2" in FigJam).
Plain HTML, CSS and JavaScript: no build step, no dependencies.

## Files

| File | What it holds |
|---|---|
| `index.html` | Phone frame, dock, the "Log the send" sheet, the "Keep climbing?" sheet |
| `styles.css` | Colour tokens (`:root`), the phone frame, dock and shared tiles |
| `pages.css` | Every other screen, in flow order |
| `app.js` | Sample data, one view function per screen, hash routing and click handling |
| `i18n.js` | 中文 / English: the Chinese for every string, and the volume-down switch |
| `img/` | Photos used on the pages (Unsplash) |

## Run it locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python -I serve.py 8000 .
```

`serve.py` is `http.server` plus byte ranges, which videos need to start mid-file (the trimmed tries depend on it). Plain `python -m http.server` also works, but seeking in a video may not.

Then go to http://localhost:8000.

## Live on Vercel

https://chalk-prototype-omega.vercel.app (project `chalk-prototype`, static, no build step). Snapshots are at `/versions/v1/` to `/versions/v7/`. To update it, run this from this folder:

```bash
vercel deploy --prod
```

`.vercelignore` keeps `serve.py` out. Vercel serves byte ranges, so seeking in the videos works there too.

The phone frame is an iPhone 16 Pro in natural titanium: a 402 × 874 pt screen, a 7 pt black bezel, a 3 pt titanium band with the Action button, volume buttons, side button and Camera Control, a 126 × 37 Dynamic Island and a 54 pt status bar.

Press the phone's volume-down button to switch the whole prototype to Chinese, and again for English. The choice is remembered; `?lang=zh` opens in Chinese the first time. `app.js` always writes English; `i18n.js` translates each text and label as it appears (exact strings first, then patterns such as `Film try {}`). When you add or change a string in `app.js`, add its Chinese to `ZH` in `i18n.js`, or it shows in English. In a short window the whole phone scales down to fit (it never squashes). On a real phone (under 480 px wide) the prototype fills the screen with no frame.

After changing a CSS or JS file, bump the `?v=` string on its link in `index.html` so browsers don't keep showing the old copy.

## Screens, in flow order

| Flow lane | Step | Screen |
|---|---|---|
| Set up | Opened from a buddy's tag: accept or decline the clip | `#/setup/tag` (open with `?from=tag`) |
| Set up | Pick your gym / add your gym in 30 s | `#/setup/gym`, `#/setup/addgym` |
| Set up | Your level, height and arm span (optional), and "your sends are public, hide any climb" on the same screen → Videos | `#/setup/level` |
| At the gym | Scan a wall (Walls or "+"): frame one route and snap; we read its tape colour and the grade on the gym's tag, and draw the moves on the photo: start, each hand in order, the feet for it. Step through move by move; the longest reach is planned for your height and arm span. At the bottom: Retake, or Open this route (its beta, your tries and Film try 1 are there); log it, or watch climbers your height on it (v4) | `#/scan` |
| At the gym | Walls: your routes (climbed, filmed or scanned) and Scan a wall to find new ones; no gym route list, no reset dates (v4) | `#/walls` |
| At the gym | Gyms near you (tap the gym's name in Walls, or Profile): 1, 5, 10 or 25 mi; a list (photo, distance, street, crowd now; tap one to make it your gym, Directions opens Maps) or a full-screen real map (OpenStreetMap) with you in the middle, a ring at that distance and a pin per gym; tap a pin for its card (v6) | `#/gyms` |
| At the gym | Pick a project; beta from climbers your height | `#/route/<n>` |
| At the gym | "+" → add a climb: Film, Upload, Scan a wall, Log by hand, four equal tiles (v4). Always Add, in a session too | sheet on any screen |
| At the gym | Film your tries: "Film try N" on the route card opens the camera at once; the session starts with the first recording. One recording for many tries; each try is cut out automatically. After Stop the tries stay on the camera with the highest move of each: "I topped it" or "What to change", and the shutter for the next try (v4) | `#/cam` |
| At the gym | Upload: pick one or many (videos already added are hidden), and you're back in Videos at once while they're read in the background (v3) | sheet → `#/videos` |
| At the gym | Log by hand: gym from your location (or search and pick); snap the route's tag, or pick tape colour and grade | sheet |
| At the gym | A live session shows in the Dynamic Island on every page; tap it for the session bar (clock, tries, End) at the top of Videos | status bar |
| At the gym | Watch: connect, the three wrist screens of a try (v2) | `#/watch` |
| Learn from the fall | Compare with a sender, one tip and one drill, try again now? | `#/compare` |
| Log the send | How it felt, a note, who filmed you → "Keep climbing?" | sheets on any screen |
| Over time | End session: tries, sends, time; hide any climb (its videos too); tap a climb to watch its video | `#/summary` |
| Over time | Profile (a tab, and your photo at the top of every other tab): progress heatmap, sends per grade, monthly recap, export, watch, sharing | `#/profile` |
| Over time | Videos, the first tab and where the app opens (v6): each day with its gym and tries, one card per route with every try on it inside; filter by route (v3) | `#/videos` |
| Over time | One video: play, highest move, time on the move you stall, one tip, compare; your tries on this route side by side, with Film the next try; route and gym under the video, Change to fix; public or hidden, delete; share a send as a poster | `#/clip/<id>` |
| Over time | A video is analysed as soon as it arrives, on any page, and Videos shows Analysing or Check this on its card: `pose.js` goes through the whole video once, in the browser, with real progress. The three sample videos ship with that scan already done (`video/*.track.json`), so a demo doesn't wait; Fix it scans for real. On the first video of a route you confirm the climber and route we found (Looks right, or Fix it and tap your head, hands and feet, which scans again from your taps); later tries on that route skip this. The result is shown on the video and under it, at the moment the video is at: skeleton and elbow angles on the picture, moves so far, arms and hips beside it, and a timeline of each hand and foot and every rest that you can tap to go to that moment. Summary opens with one conclusion from those numbers, shown with frames taken from the video itself (two to compare when there's something to compare, one when there's too little to judge) and a strip of the whole climb. A video with no route yet is analysed too; tagging the route adds the route side, then what to do next. The hips conclusion only says what happened, without telling you what to do: on The Way Up, climbers with more experience were centred less, so the rule isn't good enough to be advice. Its button plays just that stretch at half speed right there in the card, with its start, end and current time, and stops at its end. The frames and the rows under What we measured play the same way, where you tapped them, then lists what we measured, each with its moment. A move on the route (Move 4/6) is not a hand and foot move (25 in a video): the first is how far you got, the second is what we track. Moves, rests, angles and hips come from this video. The fall reason, path and drill are marked Example: they need the hold map. Videos play start to end at 0.25×, 0.5× or 1× | `#/clip/<id>` |
| Learn from the fall | Why you came off, on a video of a fall: likely reason with its evidence, hands and feet over time, your path against climbers your height, a reach check, falls across routes and one drill. Sample data: the hold map and contact log are not built yet | `#/clip/<id>` |
| Over time | A video with no route: pick the gym if it has no location, then tap the route's photo or pick tape colour and grade, right on the video's page (v3) | `#/clip/<id>` |
| Over time | Videos opens on every imported video, newest first, with Import videos at the top. The two sample videos are already imported for every climber, new or regular. Import is a demo: it opens the prototype camera roll, and no real file is read. Below the videos: analysed count, filmed by friends, highlight reel, Select to hide / change route / delete several, free up space, older routes | `#/videos` |
| Over time | Community: a feed of videos people posted, with likes and comments, then group climbs and the partner calendar | `#/friends` |

## Two climbers

- `index.html` opens as a new climber, at set up.
- `index.html?view=regular` opens as Maria a few months in, on Videos, with projects, a friend's tag and history.

## Versions

`versions/v1/` to `versions/v5/` are frozen copies of the prototype, all from Nov 3, 2026, kept to show how the design changed. Open `index.html` in any of them. `versions/v7/` was frozen on Nov 9, 2026; it has its own code, pictures and model, and plays the videos from the site's `video/` folder (`../../video/`), so don't delete a video v7 still uses. v6 is commit 1fd4ba8.
It assumes the gym publishes its routes (lists, scan, beta all come from that data) and records tries only through the in-app Record button.
Questions that led to the next version:

- Most climbing apps let you upload photos and videos for analysis, and log the grade and gym by hand. v1 only imports clips once, at set up.
- Routes are not fixed: they are set by each gym and reset every few weeks, so logging has to work on site, from what the climber sees.
- A watch could record a session faster than the phone (tap per try, session time), while the phone camera films.

v2 answers those questions:

- "+" offers three ways to add a climb: film a try, upload a video, or log by hand. During a session it is Record and opens the camera.
- Log by hand needs only the gym, tape colour and grade, so it works on routes the gym never listed. If the route is on the gym's list, it is logged against it.
- Uploads are read for gym, date and tape colour, and the climber confirms or changes them.
- A paired watch starts and stops the phone camera and counts tries and session time. Regular Maria has one; a new climber connects one on `#/watch`.
- Videos get their own tab, where you manage them and read each one's analysis. Progress moved into the profile, so the dock is Today, Walls, Add, Videos, Friends.
- Four ideas borrowed from KEKE (an iOS bouldering log, App Store listing read Nov 3, 2026):
  - Every video is trimmed to the climb and matched to earlier tries on the same holds.
  - Photos keeps being checked for new climbing videos, not only at set up.
  - Videos can be managed in bulk, and originals deleted from Photos to free space.
  - A send can be shared as a poster, and all sends as a highlight reel, labelled for you.
- Set up went from five screens (gym, import clips, clips sorted, level, sharing) to two (gym, then level with the sharing note). Importing moved out of set up: Videos offers the climbing videos it finds in Photos, with a dot on its tab.
- KEKE is an archive for climbers who already film themselves. chalk. stays aimed at beginners: one tip and one drill per try, beta from climbers your height, and a fast start.

v3 follows KEKE's user flow, from a screen recording of the app (Nov 3, 2026): add first, fix later.

- Uploads and videos found in Photos no longer stop on a "Is this right?" or "N videos read" sheet. You pick, you're back in Videos, and a card shows them being read.
- Videos reads like KEKE's Records: a day, its gym and how many tries, then one card per route with every try on it inside.
- What KEKE puts in the drawer under a video sits under each video here: your tries on that route side by side (with Film the next try), and the route and gym with Change. A video with no route is tagged from photos of the wall on its own page.
- Gym, both ways: it comes from your location, and Change opens KEKE's gym search, nearest first, with "Can't find it? Add your gym". A video with no location in it goes under "Unknown gym" until you pick one.
- Route: snap its tag, or pick tape colour and grade from KEKE's rows, in Log by hand, in Change, and on a video with no route. In v4 there are no photos of "routes on the wall now". Walls reset every few weeks, so the app can't promise a route is still up, and it doesn't show what it can't promise.
- Kept from v2: actions have words, not just icons.

v4 kept KEKE's flow and goes deeper where KEKE only stores videos. Planned: body analysis in each video, coaching from it, crews and partners, beginner onboarding. VS compares mainly with other climbers' public videos on the same route, so the community's videos get reused as beta. Built so far:

- Scan a wall reads a photo, not just a live view. The tape colour comes from the holds and the grade from the gym's tag. The moves are drawn on the photo, numbered in order, with the hand for each and the foot chips to stand on. Step through them one at a time.
- The beta is planned for your body: with an arm span shorter than the longest reach, it adds a high foot before that move.
- Walls and Today show only routes the app has seen for itself: ones you climbed, filmed or scanned. The gym's route list, reset dates and "N people topped it this week" are gone. A new climber starts from "Find your first route": film, or scan a wall.
- "+" is KEKE's add menu: four equal tiles (Film, Upload, Scan a wall, Log by hand), and nothing to choose before you start. The camera reads which route you're on from the tape in frame; tap the route at the top to switch if it's wrong (not while recording).
- Film is one path, start to finish in the camera. v2–v3 had "Show me on the wall", then "Start climbing", then "Film try N"; Film silently started the session; and after Stop came three sheets in a row ("Sent it?", the send form, "Keep climbing?") that left the camera. Now:
  - "Film try N" on Today and on a route opens the camera with that route. Film in "+" shows "Reading the tape…" until the route is read, and claims nothing before that.
  - The session clock starts with the first recording, not when the camera opens.
  - After Stop, the tries saved stay on the camera, each with its highest move (tap one to watch it). The shutter is right there for the next try.
  - "I topped it" marks the send in one tap. The note and who filmed you are optional ("Add a note"). "What to change" opens the compare.
  - The last video's thumbnail sits left of the shutter, like the phone's own camera. "Log without video" moved out of the camera (it is in "+").


v5 (in `versions/v5/`). Routes are reset every week, so a home screen built around specific routes ("Next goal: Yellow V3") goes stale. v5 sets goals by grade and by skill, which outlive any one route:

- The goal is the next grade ("your first V3"), not a route.
- Today's plan is set the way a coach sets a session, in one card about 200 pt tall. One focus comes from your own videos ("turn your hip in on long reaches"), and a thin strip shows the four steps, each as wide as its minutes: warm up 10, drill 15, project 20, cool down 5. The step you're on opens under it: its name and minutes, a 0:20 demo, one line on what to do with the rest and stop rule folded in ("Rest 3 min between. Stop if your fingers open."), its reps to tick, and Film for the drill and project only. The step first sat in its own card with a big title and two full-width buttons; it took half a screen. Warm-ups and stretches are ticked by hand, since nobody films those. Drill and project reps also tick themselves from the tries you film at that grade. Any colour on the wall works.
- Under the headline: how close your best try at the next grade got, as a small staircase of its moves ("Move 4 of 6 is your closest, in 11 tries").
- Under the photo is one grid with no section titles: sends by grade across the top (total, one column per grade, the next grade in lilac; tap it for Profile), then friends and crowd side by side. The gym's name in the header changes the gym. The watch left Today: the camera shows it and Profile connects it. Today fits one screen of the 16 Pro (874 pt) with no scrolling, even with Film showing in the plan. During a session the goal line becomes the session bar, the route you just filmed is one row (its highest move and how much longer you spent on it than people who topped it; tap it for what to change), and sends by grade wait for the summary. The big route photo card left Today: Film is already on the plan.
- v5 first had the three steps as grade tiles ("Warm up · 2 climbs at V1"). That said how many but not how, how long to rest or when to stop, so it read like a counter, not a session.
- The route picker ("Your 3 routes · tap a photo to switch") is gone from Today. The route you just filmed shows up during a session.

The site itself is v8: v7 with the Simulated climb drawn from the video itself. When no one else has filmed the route, the Path tab draws your own climb again on that video's wall: twelve frames from across the climb are laid on the wall where they belong, with the climber blanked out of each, and each pixel takes the colour of the middle one, so the wall shows in colour without you on it; a ring marks each hold you used, placed where the fingers or toes were rather than the wrist or ankle (two rings for the start holds, hand holds numbered in the order you took them; a stop the model couldn't really see is left out); and the body is your own movement as the video tracked it, at your pace (rests sped up): each hand and foot stays on its hold until the video sees it move, elbows and knees bend the way yours did, frames the model misread are dropped, and a slip in matching the picture to the wall is put back in line. v7 drew an example body on a stock wall photo with made-up holds.

v7: v6 plus the video analysis (each video is analysed on its own, with tracked points on the video, a timeline, one conclusion with frames from the video and a strip of the whole climb). v6 is commit 1fd4ba8. What came with v6: no Today page. The app opens on Videos, like KEKE opens on its records. Dock: Videos, Gyms, Add, Friends, Profile (Gyms was Walls). The dock shows on those four tabs only; every page opened from a tab (route, clip, compare, gyms, set-up) has a back button instead.

- Every version of Today asked the climber to follow something: a route card, then grade tiles, then a coach's 50-minute session with reps to tick. Bouldering doesn't run that way. Beginners pick a route they see, try it, watch others, rest when they like and go home when their fingers are done. Nobody taps a checklist with chalky hands.
- Everything Today offered already lives somewhere else. Adding a climb (film, upload, scan, log) is "+". What you climbed and how high you got is Videos. Sends by grade and the monthly recap are Profile. Friends at the gym are Friends.
- During a session, the clock, tries, tops and End sit at the top of Videos, above today's tries. The Dynamic Island opens it from any page.
- Projects stay first in Walls until you top them.
- Gyms near you is a page of its own (`#/gyms`): pick how far you'll go (1, 5, 10 or 25 mi), then see the gyms as a list or on a map. The map is a real one: Leaflet with OpenStreetMap tiles in grey, centred on the UIUC Main Quad as "you", zoomed to the ring. It needs a connection; without one the map says so and the list still works. The gyms on it are placeholders, put at their distance and bearing from you. The map opens full screen with no dock: back and the distance chips float at the top, and the count (or the card of the pin you tapped) floats at the bottom. Directions would hand off to the phone's Maps app; here it shows a toast.
- Walls before your first route: one real wall with a route drawn on it, so a first-timer sees how bouldering works instead of reading it. Four notes on the photo: one colour is one route, the start hold (both hands, tape under it), the grade tag (your level), and the top (both hands, then climb down or drop with bent knees). One button under it: scan the wall in front of you, which marks the same four things on their route. Once you have scanned or climbed a route here, Walls shows your routes instead. Plain words for everyone: "Topped" (not "Sent"), "got to move 4 of 6" (not "highest move"), "+ Try again" (not "+ Project"), "how climbers your height did it" (not "beta").
- Every climb belongs to a gym (v6). The Gyms tab (`#/walls`, was Walls) lists gyms: first "Where you climb" (gyms where you have routes or videos, with how many and the last day you climbed there), then "More near you" within 1, 5, 10 or 25 mi, with a Map button for the full-screen map (`#/gyms`). Tap a gym for its page (`#/gym/<n>`, no dock): your routes there, or the marked wall titled "New to <gym>" if you have none. Scanning or logging from a gym's page makes it the gym you're at. The app opens at the nearest gym. Every route and video keeps the gym it's on. Each gym grades its own way: Crag House, Up Wall and Stone Mill put a grade tag by every start; Boulder Barn, Granite Room and The Cave use a colour circuit, so the guide shows the colours with yours picked out. The live bar on Videos names the gym (tap it for that gym's page). Profile lists the gyms you've climbed at. Colours and gyms are placeholders.

## Deploy

Upload the whole folder to any static host (GitHub Pages, Netlify, Vercel). There is nothing to build.

Gyms, people, routes and numbers are placeholders.

## Live analysis on videos (v6)

Open a video (the Yellow V3 try, Jo's Blue V3 try, and every try you film in a session) and press play. `pose.js` runs MediaPipe Pose Landmarker (the full model, from jsDelivr and Google's model storage) on every frame in the browser, nothing uploaded. It draws the climber's body points on the video and updates the readout live:
- the hand or foot moving now;
- arms straight or bent, with the elbow angle;
- hips over the feet or out to one side (the dashed plumb line);
- moves so far (a hand or foot that travels and settles);
- the share of rests on straight arms, and the longest rest.

The tip under it changes with what it sees. When the video ends, it sums up the try. When more than one person is in frame it follows the climber: the body about the same size and closest to where the hips just were (it waits up to 1 s rather than jump to someone else), or, when it starts or loses them, the body whose feet are highest on the wall. A person standing near the phone is skipped. The model needs a connection the first time.

Videos:

- `video/rockspot-v3.mp4`: [Indoor Bouldering V3 Rock Spot](https://commons.wikimedia.org/wiki/File:Indoor_Bouldering_V3_Rock_Spot.webm) by Cryptic C62, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). We used the file's earlier 480×272 version, turned it upright and trimmed it to 0:01.5–0:42.5. This changed clip is under the same licence. The climber tops the route, so no fall is shown.
- `video/pro-wa4-rakovec.mp4`, `video/pro-wa4-garnbret.mp4`, `video/pro-wb1-raboutou.mp4` and `video/pro-wb1-pilz.mp4`: cut from four films of the IFSC World Cup Munich 2019 by Boulder Rundfunk on [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Boulder_Worldcup_2019_Munich), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Trimmed to one climb each and cropped to portrait to follow the climber.
- The other `video/wayup-*.mp4` files: participants 1 to 10 on the green and orange routes of the same dataset, same licence, cut the same way.
- `video/wayup-p8-green.mp4` and `video/wayup-p2-green.mp4`: participants 8 and 2 on the green route of [The Way Up](https://doi.org/10.5281/zenodo.15196866) by Maschek & Schedl, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). We kept them at 720×1280 (crf 23), removed the sound and trimmed them to the climb.
- `video/pexels-7591864-crop.mp4` and `video/pexels-7591810-crop.mp4` (Pavel Danilyuk on Pexels) and `video/6687076-sd_506_960_25fps.mp4` (Pexels, thumbnail `img/v6687076.jpg`): community posts, under the Pexels licence.
- `video/pratteln-1.mp4` to `pratteln-6.mp4`: from "Boulder Cup in Pratteln B2 in 2017" by Amada44, Wikimedia Commons, CC BY 4.0 (https://commons.wikimedia.org/wiki/File:Boulder_Cup_in_Pratteln_B2_in_2017_-_6594.webm). Six attempts on boulder 2 of the women's competition, filmed handheld from the crowd. Changes: cut into attempts, cropped to 9:16 with a window that follows the climber (from the app's pose scan), scaled to 720×1280, sound removed.
- `video/px-<id>.mp4` (ten clips): Pexels videos 7591545, 7591479, 7591538, 7591475, 7591808, 7591477, 7591603 and 7591535 by Pavel Danilyuk, 5382887 by Allan Mas and 6690707 by cottonbro studio, under the Pexels licence. Scaled and cropped to 720×1280, sound removed. They are community posts by sample people (Chloe, Ben, Ravi, Ines, Tom, Felix); the people filmed are models, not those names.
- `video/tt-2.mp4` to `tt-8.mp4`: TikTok videos saved by the project owner, for this private prototype only (not for public release). Creators: @tiffneedsavacay (2), @reelclimbs (3), @boulderaddicts (4, 6), @sophia_halley (5), @bigmanclimbs (7), @henry_lovegrove (8). No blur: each clip starts after the left-middle TikTok watermark has gone (about 4–5 s in) and the bottom strip, where the bottom-right watermark sits for the rest of the video, is cropped off (576×766, 576×704 for clip 2); the outro is cut; each post credits the creator's handle instead. A clip of a child (@juniorclimbs) was left out. Posted by the sample person Mei as "shared from TikTok", and they are the first seven posts in the feed.
- Not used any more: `video/r-lpj1bzih3ytb1.mp4` (posted on Reddit) and `img/vr1.jpg`.

The thumbnails `img/vrock.jpg`, `img/v864.jpg` and `img/v810.jpg` are frames taken from these videos. `img/vrock0.jpg`, `img/v8640.jpg` and `img/v8100.jpg` are their first frames, used as posters so the tracked points land on the right picture.

## Path tab

If someone in the community filmed the same route, Path shows your video and theirs side by side. If no one has, it shows a simulated climb at your height (`poseClimb` in `pose.js`).

Blue V3 is the first case. Both videos are real and on the same route: `video/wayup-p8-green.mp4` (173 cm, climbing 1–2 years) as "you" and `video/wayup-p2-green.mp4` (171 cm, over 10 years) as "Sam", a made-up name for an anonymous participant. They start as the left hand takes the same hold, 0:40 and 0:39, and the times in the card come from the coach's labels. Matching is written by hand for this pair: the app can't yet tell that two videos show the same route. The pair differs from the Blue V3 route in the prototype, whose move count and height are still made up.

Three more pairs from The Way Up are imported the same way, each with one climber as "you": participant 1 and participant 10 ("Noor") on the green route, participant 1 and participant 2 ("Sam") on orange, participant 5 and participant 3 ("Leo") on orange. The names are made up. For each pair the numbers come from the coach's labels: the first time both took one hold, then the next hold both used.

Four rope-free videos from the Munich 2019 World Cup are imported like any other video and analysed the same way: Rakovec and Garnbret on WA4, Raboutou and Pilz on WB1. Path shows the other climber on the same boulder. Both pairs are on the same boulder according to the film's own labels. The note on Path was written by watching the films; it isn't measured by the app.

Yellow V3 is the second case. Its holds are an example, because the app can't map a wall yet.

## How it could look

The main conclusion can show a simulated pose: the frame stays still, the climber stays on it in white, and a lime body moves to a better position. `posePlan` in `pose.js` builds it from that climber's own track. Limbs keep their length, and hands and feet stay put unless the plan moves them.

- Hips: if a foot later reached a spot that puts the hips over the feet, the foot goes there first (the wall tracking carries that spot back into this frame). If not, the hips shift over the feet.
- Rest: the body sinks under the higher hand until that arm is straighter, at most 0.6 of a torso.
- Feet: the lower foot goes up, to where it landed next if we saw that, and the hand reaches for where it landed. If we didn't see a landing, the caption says the foot position is a guess.

If the body can't reach the pose, or the change would be too small or too big, the card shows no picture. Nobody has checked these poses: no coach has reviewed them, and the app can't see holds, so they are a guide to the idea, not the right beta.

## How well the moves are found

A move is a hand or foot landing on a hold. `pose.js` finds one in two steps:

1. **Stops.** During the scan it follows patches of wall (never the climber), so a limb is read in wall positions even when the phone moves. A fingertip or toe that stops somewhere new is a candidate. This runs in plain JS at 200 px wide, one step per sample.
2. **Network.** A small network (`model/moves.json`, 3 models averaged, about 0.25 s on a laptop) reads the fingertips, toes and body at 5 samples a second. It keeps a stop only if it gives that limb at least 0.3 within 0.6 s, and adds a landing of its own at 0.6 or more where no stop is near.

If the file can't be read, the stops stand alone. Its answers match the Python model to 0.000005 on all 27 tracks.

It was trained on the coach's labels in The Way Up (Maschek & Schedl, CC BY 4.0, https://doi.org/10.5281/zenodo.15196866): 22 videos, 885 placements, 11 climbers, 2 routes. The two limits were chosen on half the climbers and scored on the other half. A match is the right limb within 1 second, on climbers and a route the network hadn't seen:

| The Way Up, held out | Found | Reported moves that are right |
|---|---|---|
| Hands | 71% | 54% |
| Feet | 73% | 68% |
| All | 72% | 60% |

The earlier model found 53% with 76% right, so this one misses fewer moves and adds more false ones. The Way Up has a fixed camera, so these scores don't test the wall tracking.

Three test videos have a moving phone (the two in the app, and a shorter clip of the Pexels climber). On them, against labels we made ourselves at 1 frame a second (27 moves, within 1.5 s), a real browser scan found 12 of 14 hands and 9 of 13 feet, and reported 31 moves, where the labels have 27. Picking the same number of random times finds about 6 hands and 5 feet. This is a small set, two videos show the same climber, nobody independent labelled it, and we looked at these videos while building the method, so read it as a sanity check.

A scan took 16–46 s on a laptop GPU for clips of 14–41 s. Wall tracking took 2 s of the 32 s measured on one 14 s clip, and 23 s of 62 s with the CPU slowed 6 times. That is an estimate of a slower device, not a phone measurement; no phone has been timed. Scans also change with the GPU: one clip saw the climber in 52% of frames on an Intel GPU and 72% on an NVIDIA one. Arm angles and the hip rule are not checked by this.

## Arm angles

An arm only gets an angle when shoulder, elbow and wrist all have confidence of at least 0.3 and both parts of the arm are at least 0.3 of the torso length on screen (`readArms` in `pose.js`). Otherwise the app shows no angle. On a far-off climber the wrist is a guess, which used to read as 9°. Conclusions about arms need at least half of the rest time readable; the whole-climb figure needs 30% of the climb. The thresholds were set by checking which readings looked impossible, not against measured angles.

## Importing a video

Importing is a demo: the camera roll lists videos that ship with the app. A picked video opens in the editor (`viewEdit` in `app.js`), where you trim it, set its speed, and set the try, gym, tape colour, grade and result. Post to community adds it to the Friends feed. Analyse opens the body check, then the analysis page. Nothing is analysed before that. A trimmed video is analysed only on what's left of it. Speed and trim aren't applied to the file: playback in the editor shows them, and the app keeps them with the video.

## The length timeline

The editor's Length section is a strip of frames from the video with a time ruler under it. The strip is read once per video with a second, unseen player and kept for the session (`edStrip` in `app.js`). A drag that starts near a handle moves that handle; anywhere else, and anywhere on the ruler, it moves the playhead. Vertical drags scroll the page. Arrow keys move a focused handle by 0.1 s, or 1 s with Shift. Only the chosen stretch plays, and the analysis page plays the same stretch at the chosen speed. The video file itself is not cut.

## Community

The tab has two parts along the top, For you and Friends. For you is a full-screen feed in the style of short-video apps: the post follows your finger or mouse as you drag, and letting go carries it to the next one or back. A drag of 16% of the screen or a quick flick turns the page. Your own posts come first. The post on screen plays muted and looping, with a thin progress bar. One tap pauses, two taps like, and each post starts again when you arrive at it. The wheel and arrow keys move one post at a time. Follow, like, comment, save and share sit on the right; following hides the + once it is done, and save only shows a confirmation, and comments open in a sheet. The + at the top left posts a video through the camera roll and the editor, then returns to the feed. Reduced-motion settings turn autoplay off. Friends (`#/friends/plan`) holds group climbs, the partner calendar, film requests and the invite.

Other people's names, notes, likes and comments are sample data; the videos are real and credited on each post. Share only shows a confirmation. Likes, follows, comments and posts are lost on reload.

Tapping a climber's avatar or the title of their post opens their page (`#/person/<name>`, `viewPerson` in `app.js`): gym, height and years climbing, a Follow button, sends, hardest grade and climbs this week, then their videos. A video opens the feed at that post. If you have a try on a route they climbed too (Noor, Sam and Leo, from the side-by-side pairs), a row under Routes you both climbed opens your try on its side-by-side. Your own avatar opens your profile. Every post names its gym and wall, in the feed and on the person's page, because the same tape colour means a different route in each gym. A person's gym is the gym of their latest post. Noor, Sam and Leo posted from the gym and wall of your Way Up tries, so their side-by-side comparisons are on the same route. The people and their numbers are sample data.

The community feed has 40 posts in either view, from twelve sample people. Each Way Up participant is one person: participant 2 is Sam, 3 Leo, 4 Mia, 6 Kai, 7 Lena, 9 Omar and 10 Noor, mostly with one climb on each route. Participants 1, 5 and 8 are you: five of your tries in Videos come from them, already analysed. Yuki's lead climb is the Pexels clip.

Rosa, a sample person, posts six attempts filmed at the Pratteln Boulder Cup. The climbers in them are real athletes, so the app does not name them or make up anything about them. Those clips are only community posts: the camera moves, so the app doesn't analyse them.

In the feed only the post on screen and its two neighbours keep their video loaded; the others are emptied as you swipe away. Each loaded video holds a connection open and a browser allows only about six to one server, so before this, after about nine swipes new posts stopped loading and showed only their picture.

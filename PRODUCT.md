# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

College students who are new to climbing, starting out on top rope and bouldering at a campus gym (ARC Climbing Wall, UIUC). They want to see what they are doing wrong on the wall and get better on the routes they keep trying.

## Product Purpose

Spotter is an indoor climbing app for beginners (DTX 495, UIUC; a clickable prototype). You film a try on a route and the app shows what your body did on the wall. Success: a beginner understands one concrete thing to change on their next try, and sees it work.

## Positioning

Movement measured from video: a pose scan (MediaPipe Pose Landmarker) of your own try shows every move, rest and where your hips were, and puts it side by side with others on the same route. Logging and social features support this; they are not the core.

## Operating Context

Used at the gym between tries, on a phone, often one-handed. Flow: film or import a try, see the analysis, compare with others on the route, log sends by hand when not filming, plan sessions with friends.

## Capabilities and Constraints

- Plain HTML, CSS and JavaScript, no build step; served by `serve.py` (byte ranges for video seeking); deployed on Vercel.
- Tabs: Videos, Gyms, Add, Social, Profile. Bilingual English / 中文 (`i18n.js`).
- The Videos tab shows only the user's own uploaded videos (album, pinned moments, per-gym binder). A video without a gym gets a tag hint, not a separate card.
- Every pop-up is a bottom sheet; never a centered dialog.

## Brand Commitments

- Fewer rounded corners: square or pixel-cut corners over soft rounding.
- Videos tab keeps the album design (fanned "All videos" card, Pinned, Gyms binder).
- Bottom sheets only for pop-ups.

## Evidence on Hand

- Climbing videos: The Way Up (Maschek & Schedl, CC BY 4.0), shown as if filmed at the ARC; their pose scans in `video/*.track.json`.
- Gym photos, address and hours from campusrec.illinois.edu (Nov 2026).
- Names, grades, likes and comments are sample data; every climbing number is measured from the videos. Do not invent other users, reviews or metrics.

## Product Principles

1. Show the body: the measured movement is the product; surfaces should make it visible.
2. Your own climbing first: the user's tries before anyone else's.
3. One thing to change next try, not a report card.
4. Usable mid-session: one-handed, quick, actions in thumb reach.

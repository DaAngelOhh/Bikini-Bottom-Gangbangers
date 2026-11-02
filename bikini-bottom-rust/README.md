# Bikini Bottom Rust: put it online (about 30 minutes, free)

You need: a free GitHub account and a free Render account. No coding.

## 1. Unzip
Double-click the zip you downloaded. You get a folder called bikini-bottom-rust
with: server.js, package.json, render.yaml, README.md and a folder called public.

## 2. Make a GitHub account and a place for the files
1. Go to github.com and sign up (free).
2. Click the "+" at the top right, then "New repository".
3. Name it bikini-bottom-rust. Choose "Public". Do not tick any extra boxes. Click "Create repository".
4. On the next page, click the link that says "uploading an existing file".
5. Open the unzipped folder and select EVERYTHING inside it (server.js, package.json,
   render.yaml, README.md and the public folder). Drag it all onto the GitHub page.
   Wait until every file finishes uploading.
6. Scroll down and click "Commit changes".

Check: on your repository page you should see the public folder and server.js.
Click into public, then assets: you should see the .glb and .mp3 files.

## 3. Put it on Render
1. Go to render.com and sign up with your GitHub account.
2. Click "New +", then "Blueprint". Pick your bikini-bottom-rust repository, then "Apply".
   (If you don't see Blueprint: "New +", "Web Service", pick the repository, set
   Runtime = Node, Build Command = npm install, Start Command = npm start,
   Instance Type = Free, then "Create Web Service".)
3. Wait a few minutes until it says "Live". You get a link like
   https://bikini-bottom-rust.onrender.com

## 4. Play with friends
1. Open your link. Pick a name and a character. Choose a room code (default: friends).
2. The menu shows an "Invite link" with your room code in it. Send that link to your friends.
3. Everyone who opens the same link (same room code) is in the same game.
   Anyone with the link can join, so treat the room code like a password.

## Good to know
- Free Render services go to sleep when nobody is using them. The first person to open the
  link after a quiet stretch waits about 30 seconds. It stays awake while people are playing.
- To change the game later: edit or re-upload files on GitHub. Render rebuilds by itself.
- If something fails, copy the red error text from Render ("Logs") and send it to Claude.

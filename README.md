# Durgesh Patil — Personal Portfolio

A responsive, accessible, framework-free portfolio, built from the supplied portfolio files. No build step, paid service, CDN, or API key is required.

## Run locally

Open `index.html` in a browser, or run this command from this folder:

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Then visit `http://localhost:3000` on your own computer.

## Publish

Upload `index.html`, `styles.css`, `script.js`, and the complete `assets` directory to any static web host. Keep the folder structure intact. All fonts and imagery are included locally, so the page doesn't rely on external requests.

The ZIP also includes `standalone.html`, a self-contained version with embedded fonts, styles, scripts, video, and artwork. The same file is provided separately as `Durgesh-Patil-Portfolio.html`. Either self-contained copy can be renamed to `index.html` and published by itself.

## Personal details

- Name: Durgesh Bharat Patil
- College: RCPIT College of Engineering
- Education: second-year Bachelor of Technology (B.Tech), in progress
- Email: travelways000@gmail.com
- Languages: C, Python, Java (basics), HTML, CSS, JavaScript (basics)
- Tools: VS Code, Git & GitHub, MS Office, Canva
- Learning: Data Structures & Algorithms, Web Development, Problem Solving

The supplied phone number was a placeholder, and the supplied LinkedIn and GitHub addresses were marked for updating. They have deliberately not been published. No projects, work experience, credentials, skill percentages, academic scores, or graduation dates have been invented.

## Features

- Original 12-second looping video wallpaper (WebM and MP4), with a static poster fallback
- Accessible pause/play control; reduced-motion and data-saving preferences respected
- Video automatically pauses when the hero is off-screen or the browser tab is hidden
- Responsive desktop, tablet, and mobile layouts
- Light/dark theme with optional local preference storage
- Accessible mobile navigation and keyboard-operated tabs
- Narrative/code view for the introduction
- Languages, tools, and learning category views
- Email links and copy-to-clipboard with manual-copy fallback
- Scroll-aware navigation, reading progress, and reduced-motion support
- Semantic markup, skip link, visible keyboard focus, and Person structured data

## Edit the content

Text and contact details are in `index.html`. Design tokens are at the top of `styles.css`. Behavior is in `script.js`.

If you change the email, update both mailto links, the Copy email button's `data-email`, the manual-copy input, and the Person structured data.

## Assets

The active wallpaper is original procedural motion artwork: a glowing three-dimensional topology mesh. Both video formats and the static poster are included locally. The earlier decorative green sculpture is AI-generated artwork, not a portrait, and is retained as an optional source asset. Font families are DM Sans, Space Grotesk, and IBM Plex Mono, licensed under the SIL Open Font License. Font license text is provided in `assets/FONT-LICENSES.txt`.

Contact actions open the visitor's email app; there is no pretend form submission and no backend. This version includes no analytics, cookies, or external tracking scripts.


## Second-year update

The profile, education card, narrative/code bio, hero badge, and search metadata now all state second-year B.Tech at RCPIT. Existing skills and learning topics were retained; no new technical proficiency or unprovided second-year coursework has been assumed.

## Customize the wallpaper

Replace `assets/topology-wallpaper.webm`, `assets/topology-wallpaper.mp4`, and `assets/topology-poster.webp` with your own matching assets, or edit `create_wallpaper.py` to regenerate the original. The decorative clip is silent and runs for 12 seconds before looping.

To regenerate the media (optional; not needed to run the site):

```bash
python -m pip install numpy opencv-python-headless Pillow imageio-ffmpeg
python create_wallpaper.py
```

After editing the site or video, rebuild the self-contained HTML and deployment ZIP with `python make_package.py`.

## Projects & social links

- **Projects section (03):** CSC Website for Government Services, with a live demo at https://untitled-141491804878.asia-southeast1.run.app/ (HTML, Tailwind CSS, JavaScript, EmailJS). The screenshots are in `assets/project-csc-desktop.webp` and `assets/project-csc-mobile.webp`.
- **Contact links:** GitHub, LinkedIn, LeetCode and Instagram are in the contact section, and in the `sameAs` field of the JSON-LD.
- To add another project, copy the `<article class="project-card">` block in `index.html`.
- **LeetCode** is the featured main profile, followed by GitHub, LinkedIn and Instagram.
- **Education level card:** a small "press to play" XP game in `script.js` (search for `level-card`). It's playful only and stores no data.
- **Header wordmark:** the light-up "Durgesh Patil" name (`.brand-glow`) replaces the old dp logo.

## Photography (Project 02)

- Instagram: https://www.instagram.com/clivk_nature
- The gallery uses Durgesh's own photos: `assets/photo-1.webp`, `photo-2.webp` and `photo-3.webp` (camera watermark cropped out). Clicking a photo opens a full-size viewer with arrow-key navigation and a link to Instagram. Without JavaScript, each photo links straight to Instagram.
- The old "Find me online" cards in the contact section were removed. Social links now live in the hero.
- The About section no longer has "The code" tab, and a "Find me online" row (LeetCode, GitHub, LinkedIn, Instagram) sits in the hero.

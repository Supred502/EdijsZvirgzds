-- Optional sample data: three of your real GitHub projects so the site has something to show.
-- Run once in Supabase SQL Editor. Edit or delete them later in the admin.
insert into public.projects (slug, title, tagline, body, tech, repo_url, live_url, featured, published, sort_order) values
('anime-player', 'Anime Player',
 'Desktop anime player with AniList sync, offline downloads, skip intro and a Learn Japanese mode.',
 E'## What it does\n\n- Syncs watch progress with **AniList**\n- Offline downloads\n- Skip intro\n- *Learn Japanese* mode\n\nRuns on Windows and Linux.',
 '{Python,PySide6,QML,mpv}', 'https://github.com/Supred502/Anime_Player', 'https://github.com/Supred502/Anime_Player/releases/latest', true, true, 0),
('filament-library', 'Filament Library',
 'Phone-friendly page showing every 3D-printer filament colour I own, in Latvian or English.',
 E'A quick way to check which filament colours I have before starting a print.',
 '{HTML,CSS,JavaScript}', 'https://github.com/Supred502/Filiment_Library', 'https://supred502.github.io/Filiment_Library/', false, true, 1),
('mymoments', 'MyMoments',
 'Android video diary: up to 10 seconds of clips and photos a day, backed up to your own Google Drive.',
 E'A short clip a day, stitched into a diary you can scroll back through.',
 '{Flutter,Android,Google Drive}', 'https://github.com/Supred502/MyMoments-updates', 'https://github.com/Supred502/MyMoments-updates/releases/latest', true, true, 2);

"""Development-only MP3 generation: pip install edge-tts==7.2.8.

Uses the Edge speech service through https://github.com/rany2/edge-tts.
The browser game uses only the generated local MP3s, never this service.
"""
import asyncio
import json
from pathlib import Path
import re
import subprocess
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'assets' / 'sound'
VOICE = 'de-DE-KatjaNeural'
RATE = '-5%'

def slug(name):
    return re.sub('[^a-z0-9]+', '-', name.lower()).strip('-')

async def main():
    world = json.loads(subprocess.check_output(['node', '-e',
        "require('./world.js');console.log(JSON.stringify({lines:AnimalIsland.busLines.map(l=>l.id),stops:[...new Set(AnimalIsland.busStops.map(s=>s.name))]}));"], cwd=ROOT))
    clips = []
    for line in world['lines']:
        word = {'1':'eins','2':'zwei','3':'drei','4':'vier','5':'fünf','6':'sechs','7':'sieben'}[line]
        clips.append({'file':f'line-{line}.mp3', 'text':f'Linie {word}.'})
    for name in world['stops']:
        spoken = name.replace('Sued', 'Süd').replace('Bruecke', 'Brücke').replace('Hafenstrasse', 'Hafenstraße')
        clips.append({'file':f'station-{slug(name)}.mp3', 'text':f'Station: {spoken}.'})
        clips.append({'file':f'next-{slug(name)}.mp3', 'text':f'Nächste Station: {spoken}.'})
    OUTPUT.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(2)
    async def generate(clip):
        async with semaphore:
            target = OUTPUT / clip['file']
            if target.exists() and target.stat().st_size > 1024:
                return
            temp = target.with_suffix('.part')
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(clip['text'], VOICE, rate=RATE).save(str(temp))
                    if temp.stat().st_size < 1024:
                        raise ValueError('Empty audio')
                    temp.replace(target)
                    print(clip['file'], flush=True)
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2)
    await asyncio.gather(*(generate(clip) for clip in clips))
    (OUTPUT / 'manifest.json').write_text(json.dumps({'voice':VOICE,'rate':RATE,'clips':clips}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'Created {len(clips)} local MP3 announcements.', flush=True)

if __name__ == '__main__':
    asyncio.run(main())

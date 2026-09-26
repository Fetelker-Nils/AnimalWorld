"""Development-only MP3 generation: pip install edge-tts==7.2.8.

Uses the Edge speech service through https://github.com/rany2/edge-tts.
The browser game uses only the generated local MP3s, never this service.
"""
import asyncio
import base64
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
        "require('./world.js');console.log(JSON.stringify({lines:[...AnimalIsland.busLines,...AnimalIsland.railLines,...AnimalIsland.flightLines].map(l=>l.id),stops:[...new Set([...AnimalIsland.busStops,...AnimalIsland.railStations,...AnimalIsland.airports].map(s=>s.name))]}));"], cwd=ROOT))
    clips = [{'file':'terminal-next.mp3','text':'Diese Fahrt endet an der nächsten Station.'},{'file':'terminal-arrival.mp3','text':'Endstation. Bitte alle aussteigen. Vielen Dank für die Mitfahrt!'}]
    clips.extend([{'file':'departure-30.mp3','text':'Dieser Zug f\u00e4hrt voraussichtlich in drei\u00dfig Sekunden ab. Bitte einsteigen.'},{'file':'departure-10.mp3','text':'Dieser Zug f\u00e4hrt voraussichtlich in zehn Sekunden ab. Bitte halten Sie die T\u00fcren frei.'}])
    clips.extend([{'file':'flight-departure-30.mp3','text':'Dieser Flug startet voraussichtlich in drei\u00dfig Sekunden. Bitte steigen Sie ein.'},{'file':'flight-departure-10.mp3','text':'Dieser Flug startet in zehn Sekunden. Bitte nehmen Sie Platz.'}])
    for line in world['lines']:
        match = re.fullmatch(r'([A-Z]*)([0-9]+)', line)
        prefix, number = match.group(1), int(match.group(2))
        ones = ['null','eins','zwei','drei','vier','f\u00fcnf','sechs','sieben','acht','neun','zehn','elf','zw\u00f6lf','dreizehn','vierzehn','f\u00fcnfzehn','sechzehn','siebzehn','achtzehn','neunzehn']
        tens = {20:'zwanzig',30:'dreissig',40:'vierzig',50:'f\u00fcnfzig',60:'sechzig',70:'siebzig',80:'achtzig',90:'neunzig'}
        if number < 20:
            word = ones[number]
        elif number < 100:
            unit = number % 10
            word = (('ein' if unit == 1 else ones[unit])+'und' if unit else '') + tens[number-unit]
        else:
            raise ValueError(f'Add spoken number for line {line}')
        kind = {'R':'Regionalzug','RE':'Regional Express','IC':'Inter City','ICE':'Inter City Express','UE':'Ultra Express','F':'Flug'}.get(prefix,'Linie')
        clips.append({'file':f'line-{line}.mp3', 'text':f'{kind} {word}.'})
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
    sound_path = ROOT / 'sound.js'
    sound_source = sound_path.read_text(encoding='utf-8')
    embedded = {'assets/sound/'+name:'data:audio/mpeg;base64,'+base64.b64encode((OUTPUT/name).read_bytes()).decode('ascii') for name in ['departure-30.mp3','departure-10.mp3']}
    sound_source = re.sub(r'  const departureClips=.*?;\n', lambda _: '  const departureClips='+json.dumps(embedded, separators=(',',':'))+';\n', sound_source)
    sound_path.write_text(sound_source, encoding='utf-8')
    print(f'Created {len(clips)} local MP3 announcements.', flush=True)

if __name__ == '__main__':
    asyncio.run(main())

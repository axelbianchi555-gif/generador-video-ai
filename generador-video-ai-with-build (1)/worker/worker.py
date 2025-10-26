
import os, time, json, subprocess, shlex, sys
import redis

REDIS_URL = os.environ.get('REDIS_URL','redis://localhost:6379/0')
r = redis.from_url(REDIS_URL, decode_responses=True)

UPLOAD_DIR = '/app/storage/uploads' if os.path.exists('/app/storage') else './storage/uploads'
OUTPUT_DIR = '/app/storage/outputs' if os.path.exists('/app/storage') else './storage/outputs'
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

print('Worker started, watching Redis at', REDIS_URL)
while True:
    try:
        _, payload = r.brpop('jobs', timeout=5)
        if not payload:
            time.sleep(0.5)
            continue
        job = json.loads(payload)
        jobid = job['id']
        print('Processing job', jobid)
        r.hset(f'job:{jobid}','status','processing')
        infile = os.path.join(UPLOAD_DIR, job['filename'])
        outfile = os.path.join(OUTPUT_DIR, jobid + '.mp4')
        duration = int(job.get('duration',8))
        resolution = job.get('resolution','720')
        style = job.get('style','cinematic') or 'cinematic'
        # choose scale
        if resolution=='1080':
            scale = '1920:1080'
        else:
            scale = '1280:720'
        # simple effects mapping
        filters = []
        # Ken Burns: zoompan using ffmpeg
        # create a video from still with zoompan filter
        # zoompan expression: zoom increases over frames; set fps to 25
        zoom_expr = "zoom+0.001"
        # alternative: use zoompan with zoom from 1 to 1.2 over frames
        # but to keep it simple use scale and zoompan constants
        vf = f"scale={scale},zoompan=z='if(eq(on,1),1.0,zoom+0.0005)':d={duration*25}:s={scale}"
        # style tweaks
        if 'neon' in (job.get('prompt') or '').lower() or style=='neon':
            # add hue and eq for colorful look
            vf += ",hue=s=0:s=0:rotation=45,eq=brightness=0.06:saturation=1.4"
        if 'retro' in (job.get('prompt') or '').lower() or style=='retro':
            vf += ",colorchannelmixer=.3:.4:.3:.0:.3:.4:.3:.0:.3:.4:.3"
        # generate a short audio tone and combine
        tone = os.path.join(OUTPUT_DIR, jobid + '.wav')
        # create the video with ffmpeg
        cmd = f"ffmpeg -y -loop 1 -i {shlex.quote(infile)} -vf "{vf}" -t {duration} -r 25 -c:v libx264 -pix_fmt yuv420p {shlex.quote(outfile)}"
        print('Running:', cmd)
        proc = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0:
            print('ffmpeg error', proc.stderr[:400])
            r.hset(f'job:{jobid}','status','error','error_msg',proc.stderr[:400])
            continue
        # optionally add a simple audio sine wave and mix
        audio_file = os.path.join(OUTPUT_DIR, jobid + '.audio.mp3')
        cmd2 = f"ffmpeg -y -f lavfi -i "sine=frequency=440:duration={duration}" -c:a libmp3lame -q:a 5 {shlex.quote(audio_file)}"
        subprocess.run(cmd2, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # merge audio
        merged = os.path.join(OUTPUT_DIR, jobid + '.final.mp4')
        cmd3 = f"ffmpeg -y -i {shlex.quote(outfile)} -i {shlex.quote(audio_file)} -c:v copy -c:a aac -shortest {shlex.quote(merged)}"
        subprocess.run(cmd3, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # replace outfile
        os.replace(merged, outfile)
        # clean temp audio
        try:
            os.remove(audio_file)
        except:
            pass
        r.hset(f'job:{jobid}','status','done','output', outfile)
        print('Job done', jobid, '->', outfile)
    except Exception as e:
        print('Worker exception', e)
        time.sleep(1)

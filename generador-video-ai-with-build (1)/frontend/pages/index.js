
import {useState} from 'react';
export default function Home(){
  const [file,setFile]=useState(null);
  const [prompt,setPrompt]=useState('');
  const [duration,setDuration]=useState(8);
  const [resolution,setResolution]=useState('720');
  const [style,setStyle]=useState('cinematic');
  const [job, setJob] = useState(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  async function handleSubmit(e){
    e.preventDefault();
    if(!file) return alert('select an image');
    const fd = new FormData();
    fd.append('image', file);
    fd.append('prompt', prompt);
    fd.append('duration', duration);
    fd.append('resolution', resolution);
    fd.append('style', style);
    const res = await fetch(API + '/generate', { method:'POST', body: fd });
    const data = await res.json();
    if(data.id) setJob(data);
    else alert(JSON.stringify(data));
  }

  async function checkStatus(){
    if(!job) return;
    const res = await fetch(API + '/status/' + job.id);
    const data = await res.json();
    setJob({...job, status: data.status, output: data.output});
  }

  return (<div style={{maxWidth:800, margin:'40px auto', fontFamily:'Arial'}}>
    <h1>Generador de Videos AI — Demo</h1>
    <form onSubmit={handleSubmit}>
      <div><label>Imagen (jpg/png/webp): </label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} /></div>
      <div><label>Prompt: </label><input value={prompt} onChange={e=>setPrompt(e.target.value)} style={{width:'100%'}} /></div>
      <div>
        <label>Duración (s): </label>
        <input type="number" min="5" max="30" value={duration} onChange={e=>setDuration(e.target.value)} />
        <label> Resolución: </label>
        <select value={resolution} onChange={e=>setResolution(e.target.value)}>
          <option value="720">720p</option>
          <option value="1080">1080p</option>
        </select>
      </div>
      <div>
        <label>Estilo: </label>
        <select value={style} onChange={e=>setStyle(e.target.value)}>
          <option>cinematic</option>
          <option>neon</option>
          <option>retro</option>
          <option>tiktok</option>
        </select>
      </div>
      <button type="submit">Generar</button>
    </form>

    {job && <div style={{marginTop:20}}>
      <h3>Job: {job.id}</h3>
      <div>Status: {job.status || 'queued'}</div>
      <button onClick={checkStatus}>Refrescar status</button>
      {job.output && <div><a href={API + '/download/' + job.id} target='_blank'>Descargar MP4</a></div>}
    </div>}
    <hr />
    <p>Nota: Este demo aplica efectos simples con ffmpeg. Para pipelines avanzadas (segmentación, audio reactivo, etc.) se necesitan módulos adicionales.</p>
  </div>)
}

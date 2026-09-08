export async function uploadVideo(file: File, title: string) {
  const form = new FormData();
  form.append('video', file);
  form.append('title', title);
  
  const res = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: form
  });
  return await res.json();
}

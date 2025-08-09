export default function Home() {
  return (
    <main style={{display:'grid',placeItems:'center',minHeight:'100vh',background:'#000',color:'#fff'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontFamily:'system-ui'}}>Notion → IG Feed</h1>
        <p><a href="/ig-feed/" style={{color:'#93c5fd'}}>Open the IG grid</a></p>
        <p><code>/api/posts</code> must return JSON for the grid to load.</p>
      </div>
    </main>
  );
}

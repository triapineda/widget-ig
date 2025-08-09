# Notion → IG Feed (Next.js project, ready for Vercel)
Deploy steps:
1) Import this folder into Vercel (or upload ZIP).
2) In Project → Settings → Environment Variables add:
   - NOTION_TOKEN (from your Notion integration)
   - NOTION_DATABASE_ID (e.g. 24a4bed5c20b80b1ad85fa0924d4f384)
   - Optional: USERNAME, PROFILE_URL, AVATAR_URL
3) Click Redeploy.
4) Open:
   - https://<project>.vercel.app/api/posts (should return JSON)
   - https://<project>.vercel.app/ig-feed/ (the grid)

Notion: Share the database with your integration (Share → invite integration). Properties expected: Published (checkbox), Order (number), Image (URL or Files), Link (URL optional).

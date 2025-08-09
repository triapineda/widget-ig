import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    return res.status(500).json({ error: "Missing configuration", details: "NOTION_TOKEN and NOTION_DATABASE_ID must be set" });
  }

  const notion = new Client({ auth: token });

  try {
    let results = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const query = await notion.databases.query({
        database_id: databaseId,
        filter: { property: "Published", checkbox: { equals: true } },
        sorts: [{ property: "Order", direction: "ascending" }],
        start_cursor: startCursor
      });
      results = results.concat(query.results || []);
      hasMore = query.has_more === true;
      startCursor = query.next_cursor || undefined;
    }

    const posts = results.map(page => {
      const props = page.properties || {};
      let image = "";
      const imgProp = props["Image"];
      if (imgProp?.type === "url") image = imgProp.url || "";
      else if (imgProp?.type === "files" && Array.isArray(imgProp.files) && imgProp.files.length > 0) {
        const f = imgProp.files[0];
        image = f?.type === "external" ? (f?.external?.url || "") : (f?.file?.url || "");
      }
      const link = props["Link"]?.url || "";
      return { image, link };
    }).filter(p => p.image);

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.status(200).json({
      username: process.env.USERNAME || "simplyclad.co",
      profileUrl: process.env.PROFILE_URL || "https://www.instagram.com/simplyclad.co/",
      avatar: process.env.AVATAR_URL || "",
      posts
    });
  } catch (err) {
    console.error("Notion query failed", err);
    res.status(500).json({ error: "Failed to query Notion", details: err?.message || String(err) });
  }
}

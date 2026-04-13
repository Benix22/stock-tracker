"use server";

export async function getEconomicNews() {
  try {
    const rssUrl = "https://news.google.com/rss/search?q=economy+topic:BUSINESS&hl=en-US&gl=US&ceid=US:en";
    const response = await fetch(rssUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!response.ok) throw new Error("Failed to fetch RSS");
    
    const xml = await response.text();
    
    // Simple manual XML parsing for <item>...<title>...<link>...<source>
    const items = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const content = match[1];
      const title = content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
      const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
      const source = content.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "Google News";
      
      // Clean up title (sometimes it has " - Source" at the end)
      const cleanTitle = title.replace(/\s+-\s+.*$/, "");
      
      // Decode HTML entities if any (basic ones)
      const decodedTitle = cleanTitle
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      items.push({
        title: decodedTitle,
        link,
        source
      });
      
      if (items.length >= 15) break;
    }
    
    return items;
  } catch (error) {
    console.error("Error fetching economic news:", error);
    return [];
  }
}

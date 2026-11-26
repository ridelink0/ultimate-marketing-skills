// Official ad-library and trend pages for a search term. UMS opens these in a
// browser for the person (or in Claude in Chrome) and reads what is on screen;
// it does not scrape them. Meta's Ad Library API returns political and
// EU-delivered ads only, so the public page is the route for commercial ads.

export function adLibraryLinks(query, { country = 'US' } = {}) {
  const q = encodeURIComponent(String(query).trim());
  const c = String(country).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || 'US';
  return [
    { name: 'Meta Ad Library', url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${c}&q=${q}&search_type=keyword_unordered&media_type=all`, note: 'Active Facebook and Instagram ads. Commercial ads are visible on the page; the API covers political and EU-delivered ads only.' },
    { name: 'TikTok Top Ads', url: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en', note: 'Creative Center: filter by industry and objective, then search. Log-in may be needed for detail.' },
    { name: 'TikTok Commercial Content Library', url: `https://library.tiktok.com/ads?region=all&adv_name=${q}`, note: 'Ads shown in the EEA, Switzerland and the UK.' },
    { name: 'Google Ads Transparency Center', url: `https://adstransparency.google.com/?region=${c}&query=${q}`, note: 'Search, YouTube and Display ads by advertiser.' },
    { name: 'LinkedIn Ad Library', url: `https://www.linkedin.com/ad-library/search?keyword=${q}`, note: 'Ads run on LinkedIn by company or keyword.' },
    { name: 'TikTok Creative Center trends', url: 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en', note: 'Trending hashtags, songs and creators by region.' },
    { name: 'Google Trends', url: `https://trends.google.com/trends/explore?geo=${c}&q=${q}`, note: 'Search interest over time; switch to YouTube Search in the menu.' },
    { name: 'YouTube search, this week', url: `https://www.youtube.com/results?search_query=${q}&sp=EgIIAw%253D%253D`, note: 'Uploads from this week; sort by view count for what is landing now.' },
    { name: 'Reddit search', url: `https://www.reddit.com/search/?q=${q}&sort=top&t=month`, note: 'Top threads this month: the words buyers use.' },
  ];
}

// Share links for a world (SPEC §12): one clean URL, no tracking parameters.

export interface ShareInput {
  siteUrl: string;
  username: string;
  worldName: string;
  isOwner: boolean;
}

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export function sharePayload({ siteUrl, username, worldName, isOwner }: ShareInput): SharePayload {
  const url = new URL(`/w/${encodeURIComponent(username)}`, siteUrl).toString();
  const text = isOwner
    ? `Come visit ${worldName}, my world on Worldling.`
    : `Visit ${worldName} on Worldling.`;
  return { title: worldName, text, url };
}

export interface ShareTarget {
  name: string;
  href: string;
}

/** Fallback targets when the native share sheet isn't there. */
export function shareTargets({ text, url }: SharePayload): ShareTarget[] {
  const q = encodeURIComponent;
  return [
    { name: "WhatsApp", href: `https://wa.me/?text=${q(`${text} ${url}`)}` },
    { name: "X", href: `https://x.com/intent/post?text=${q(text)}&url=${q(url)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${q(url)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${q(url)}&text=${q(text)}` },
  ];
}

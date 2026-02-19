export interface ShareUrls {
  twitter: string;
  linkedin: string;
  email: string;
  reddit: string;
}

/**
 * Builds social-sharing URLs for each supported platform.
 *
 * All values are URI-encoded; the returned strings can be used directly as
 * `href` attributes on anchor elements.
 */
export function buildShareUrls(
  url: string,
  title: string,
  body: string,
  emailSubject: string
): ShareUrls {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const tweetText = encodeURIComponent(`${body.split('\n')[0]}`);
  const encodedBody = encodeURIComponent(body);
  const encodedEmailSubject = encodeURIComponent(emailSubject);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedEmailSubject}&body=${encodedBody}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };
}

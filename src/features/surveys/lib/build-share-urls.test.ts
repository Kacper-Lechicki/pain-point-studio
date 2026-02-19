/** Tests for social-sharing URL builder. */
import { describe, expect, it } from 'vitest';

import { buildShareUrls } from './build-share-urls';

const URL = 'https://example.com/r/my-survey';
const TITLE = 'My Survey';
const BODY = 'Check out this survey!\nSecond line.';
const EMAIL_SUBJECT = 'My Survey - Quick Feedback';

describe('buildShareUrls', () => {
  const urls = buildShareUrls(URL, TITLE, BODY, EMAIL_SUBJECT);

  // ── Twitter ──────────────────────────────────────────────────────

  it('builds a twitter intent URL with only the first line of body', () => {
    expect(urls.twitter).toContain('https://twitter.com/intent/tweet');
    expect(urls.twitter).toContain(encodeURIComponent('Check out this survey!'));
    expect(urls.twitter).not.toContain(encodeURIComponent('Second line.'));
  });

  it('includes the encoded survey URL in the twitter link', () => {
    expect(urls.twitter).toContain(encodeURIComponent(URL));
  });

  // ── LinkedIn ─────────────────────────────────────────────────────

  it('builds a linkedin share URL with the survey URL', () => {
    expect(urls.linkedin).toContain('https://www.linkedin.com/sharing/share-offsite/');
    expect(urls.linkedin).toContain(encodeURIComponent(URL));
  });

  // ── Email ────────────────────────────────────────────────────────

  it('builds a mailto link with encoded subject and body', () => {
    expect(urls.email).toContain('mailto:?');
    expect(urls.email).toContain(`subject=${encodeURIComponent(EMAIL_SUBJECT)}`);
    expect(urls.email).toContain(`body=${encodeURIComponent(BODY)}`);
  });

  // ── Reddit ───────────────────────────────────────────────────────

  it('builds a reddit submit URL with title and URL', () => {
    expect(urls.reddit).toContain('https://www.reddit.com/submit');
    expect(urls.reddit).toContain(`url=${encodeURIComponent(URL)}`);
    expect(urls.reddit).toContain(`title=${encodeURIComponent(TITLE)}`);
  });

  // ── Encoding ─────────────────────────────────────────────────────

  it('encodes special characters in all URLs', () => {
    const result = buildShareUrls(
      'https://example.com/r/test&foo=bar',
      'Title with spaces & symbols!',
      'Body line 1\nBody line 2',
      'Subject: special'
    );

    // No raw ampersands or spaces in encoded segments
    expect(result.twitter).not.toContain(' ');
    expect(result.linkedin).not.toContain(' ');
    expect(result.reddit).not.toContain('&foo=bar');
  });

  // ── Shape ────────────────────────────────────────────────────────

  it('returns all four platform keys', () => {
    expect(Object.keys(urls).sort()).toEqual(['email', 'linkedin', 'reddit', 'twitter']);
  });
});

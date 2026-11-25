# Commonplace

A personal writing archive for GitHub Pages. Responsive layouts, a searchable archive, topic filters, light/dark themes, RSS, and support for images, audio, and video. No analytics, remote fonts, or external scripts are loaded by the starter.

## Add a post in your browser

1. Open `content/posts` on GitHub.
2. Choose **Add file → Create new file** and name it `my-new-post.md` (lowercase words with hyphens).
3. Copy the example below, replace the header values and body, then **Commit changes** to `main`.
4. The **Publish website** workflow builds and publishes the site. Check the **Actions** tab for its result.

The text between the `---` lines is JSON. Keep its double quotes, commas, and braces.

```markdown
---
{
  "title": "My new post",
  "date": "2026-11-24",
  "kind": "Writings",
  "tags": ["Reading", "Ideas"],
  "summary": "One sentence introducing this piece.",
  "published": true
}
---

Write your post here. Use **bold**, *italics*, and [links](https://example.com).

## A section heading

Another paragraph.

> A short quotation.
```

Kinds: `Writings`, `Note`, or `Project`. Entries are sorted by date. Set `published` to `false` to exclude an entry from the built site, RSS, and search. Dates do not schedule publishing: a future-dated entry with `published: true` is published on the next build.

**This is a public repository.** All committed source files and previous revisions are publicly readable, even when an entry is excluded from the website. Keep private drafts, personal information, passwords, and API keys outside the repository.

## Add images and media

Upload images into `public/assets/`. In a post:

```markdown
![A descriptive caption for the image](/assets/my-photo.jpg)
```

For a caption below the image:

```html
<figure>
  <img src="/assets/my-photo.jpg" alt="Describe what is shown" loading="lazy">
  <figcaption>A caption or image credit.</figcaption>
</figure>
```

For a YouTube video, use YouTube's **Share → Embed** feature. Paste its iframe into your Markdown post. Give it a descriptive `title`, add `loading="lazy"`, and use HTTPS. The stylesheet makes video iframes responsive. Larger videos are best embedded from a video host instead of stored in this repository. Small local audio/video files can use HTML `<audio controls>` and `<video controls>` elements.

If the site is deployed below a repository path rather than at the account root, include that path in media URLs as well (for example `/commonplace/assets/my-photo.jpg`).

## Personalize the site

Edit `site.json` to change the title, description, introductory copy, About page, optional author credit, public contact email, and social links. An empty author or email leaves it out of the site.

Edit `public/assets/style.css` for colors, fonts, and layouts. Posts contain your writing; the shared template lives in `scripts/build.mjs`. The initial entry, **A beginning**, is a starter site note and may be edited or deleted.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm run build
npm run check
python3 -m http.server 8000 --directory dist
```

Visit `http://localhost:8000`. Rebuild after editing posts or templates. There is no persistent database or server to maintain.

## GitHub Pages setup

1. Create a public repository named `lihao-liu2014.github.io` on the `Lihao-Liu2014` account, with `main` as the default branch.
2. Upload this source tree, including `.github/workflows/pages.yml`.
3. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
4. In **Actions → Publish website**, run the workflow if a build has not already started.
5. The site will be at `https://lihao-liu2014.github.io/` after successful deployment.

The built `dist` directory is uploaded as the Pages artifact. Only site files are deployed, not this README or Markdown sources.

For a project repository instead, set `basePath` in `site.json` to `/repository-name`. Keep `url` as the account's HTTPS origin. For a custom domain, update `url` and the GitHub Pages domain settings; domain registration is optional and separate.

The included workflow uses standard GitHub-hosted runners on a public repository and GitHub Pages. No paid services, account upgrades, domain purchases, or secret credentials are required by this starter.

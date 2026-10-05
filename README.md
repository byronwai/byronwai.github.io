# 從零開始的編程生活 (Programming Life from Zero)

Jekyll blog skeleton for **byronwai.github.io**, migrated from the hexo-based
`nichijou` repository. It only uses Liquid features supported by GitHub Pages'
native Jekyll (3.9.x): plain CSS (no SCSS), no custom plugins beyond the
whitelisted `jekyll-feed`, and no `.nojekyll` file.

## Site structure

- `_layouts/` — `default`, `home`, `post`, `page` templates
- `_includes/` — `head`, `header`, `footer` partials
- `assets/css/style.css` — the whole look (plain CSS)
- `_posts/` — blog posts in Markdown
- `index.html`, `about.md`, `archives.html`, `tags.html`, `404.html` — pages
- `_config.yml` — site settings (title, lang, permalink, plugins, excludes)

## Publishing as a user site (byronwai.github.io)

1. Create a GitHub repository named `byronwai.github.io`.
2. Push the contents of this folder to the repository's default branch.
3. In the repository, open **Settings → Pages**, set **Source** to
   **Deploy from a branch**, pick the default branch and `/ (root)`.
4. The site will be published at https://byronwai.github.io.

## Publishing under /blog (project site alternative)

All internal links and asset URLs go through the Liquid `relative_url`
filter, so the same files also work under a subpath:

1. In `_config.yml`, change `baseurl: ""` to `baseurl: "/blog"`.
2. Create a GitHub repository named `blog` and push the files to its default
   branch.
3. Enable **Settings → Pages → Deploy from a branch** on that repository.
4. The site will be published at https://byronwai.github.io/blog/.

## Local preview

Requires Ruby (2.7 or newer works well) and Bundler. The `Gemfile` uses the
`github-pages` gem so the local build matches what GitHub Pages produces.

    bundle install
    bundle exec jekyll serve

Then open http://127.0.0.1:4000.

## Writing a new post

Create a file in `_posts/` named `YYYY-MM-DD-slug.md`, for example
`_posts/2017-01-19-telegram-bot-server-setup.md`:

    ---
    layout: post
    title: "[新手向] 免費Telegram bot 之 server前期設置"
    date: 2017-01-19 15:11:23 +0000
    slug: 新手向-免費Telegram-bot-之-server前期設置-1
    tags: [Apache, Cloudflare, Telegram bot]
    ---

- The date in the file name must match the post date.
- If a `slug:` field is present it is used in the URL; otherwise the file name
  after the date prefix is used.
- The `tags` field is optional; each tag renders as a pill that links to its
  section on the Tags page.
- Images live under `assets/images/` and can be embedded with
  `![name]({{ site.baseurl }}/assets/images/<folder>/<image>.png)`.

Note: this README is listed in `_config.yml`'s `exclude`, so Jekyll does not
render it as a site page.

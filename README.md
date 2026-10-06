# 錯題簿

GonJK's personal blog — security writeups, hardware tinkering, and everyday notes. Built with Jekyll and the [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) theme (via `remote_theme`), hosted on GitHub Pages.

Live at <https://byronwai.github.io/>

## Local preview

    bundle install
    bundle exec jekyll serve

Then open <http://127.0.0.1:4000>.

## Writing a post

Create `_posts/YYYY-MM-DD-slug.md` — no `layout` needed (the theme default applies):

    ---
    title: "Post title"
    date: 2026-10-05 12:00:00 +0000
    tags: [Tag]
    ---

Images go in `assets/images/<folder>/` and are referenced as
`![name]({{ site.baseurl }}/assets/images/<folder>/name.png)`.

## Theme notes

- Skin, nav and theme options live in `_config.yml` (`minimal_mistakes_skin`, `_data/navigation.yml`).
- Favicon links and the home-page terminal hero styles are injected via `_includes/head/custom.html`.

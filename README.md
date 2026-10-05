# 錯題簿

Byron Wai's personal blog — security writeups, hardware tinkering, and everyday notes. Built with Jekyll, hosted on GitHub Pages.

Live at <https://byronwai.github.io/>

## Local preview

    bundle install
    bundle exec jekyll serve

Then open <http://127.0.0.1:4000>.

## Writing a post

Create `_posts/YYYY-MM-DD-slug.md`:

    ---
    layout: post
    title: "Post title"
    date: 2026-10-05 12:00:00 +0000
    tags: [Tag]
    ---

Images go in `assets/images/<folder>/` and are referenced as
`![name]({{ site.baseurl }}/assets/images/<folder>/name.png)`.

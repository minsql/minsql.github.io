---
layout: blog
title: Blog
excerpt: "An archive of blog posts sorted by date."
search_omit: true
---

<ul class="post-list">
{% for post in site.categories.blog %}
  <li><article>
  {% if post.image.feature %}<div class="entry-feature-image"><img src="{{ site.url }}/images/{{ post.image.feature }}" class="entry-feature-image" alt="{{ page.title }}"></div>{% endif %}
  <a href="{{ site.url }}{{ post.url }}">{{ post.title }} <span class="entry-date"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %d, %Y" }}</time></span>{% if post.excerpt %} <span class="excerpt">{{ post.excerpt | remove: '\[ ... \]' | remove: '\( ... \)' | markdownify | strip_html | strip_newlines | escape_once }}</span>{% endif %}</a>
  </article></li>
{% endfor %}
</ul>

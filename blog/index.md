---
layout: blog
title: Blog
excerpt: "An archive of blog posts sorted by date."
search_omit: true
pagination:
  enabled: true
  category: blog
  trail:
    before: 2 # The number of links before the current page
    after: 2  # The number of links after the current page
---
<!-- This loops through the paginated posts  -->

<ul class="post-list">
{% for post in paginator.posts %}
  <li><article>
  {% if post.image.feature %}<div class="entry-feature-image"><img src="{{ site.url }}/images/{{ post.image.feature }}" class="entry-feature-image" alt="{{ page.title }}"></div>{% endif %}
  <a href="{{ site.url }}{{ post.url }}">{{ post.title }} <span class="entry-date"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %d, %Y" }}</time></span>{% if post.excerpt %} <span class="excerpt">{{ post.excerpt | remove: '\[ ... \]' | remove: '\( ... \)' | markdownify | strip_html | strip_newlines | escape_once }}</span>{% endif %}</a>
  </article></li>
{% endfor %}
</ul>

{% include paginator.html %}

package com.boutique.ecommerce.blog.controller;

import com.boutique.ecommerce.blog.entity.BlogPostStatus;
import com.boutique.ecommerce.blog.repository.BlogPostRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blog")
public class BlogSitemapController {
    private final BlogPostRepository postRepository;
    private final String frontendUrl;

    public BlogSitemapController(BlogPostRepository postRepository,
                                 @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.postRepository = postRepository;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">")
                .append(url(frontendUrl + "/blog", null));
        postRepository.findAllByStatusAndPublishedAtLessThanEqualOrderByPublishedAtDesc(
                BlogPostStatus.PUBLISHED,
                LocalDateTime.now()
        ).forEach(post -> xml.append(url(
                frontendUrl + "/blog/" + post.getSlug(),
                post.getUpdatedAt() == null ? null : post.getUpdatedAt().toLocalDate().toString()
        )));
        return xml.append("</urlset>").toString();
    }

    private String url(String location, String lastModified) {
        StringBuilder value = new StringBuilder("<url><loc>").append(escape(location)).append("</loc>");
        if (lastModified != null) value.append("<lastmod>").append(lastModified).append("</lastmod>");
        return value.append("</url>").toString();
    }

    private String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}

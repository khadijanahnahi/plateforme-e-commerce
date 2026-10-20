create table blog_categories (
    id bigserial primary key,
    name varchar(100) not null,
    slug varchar(120) not null,
    description text,
    created_at timestamp not null,
    updated_at timestamp not null,
    constraint uq_blog_category_name unique (name),
    constraint uq_blog_category_slug unique (slug)
);

create table blog_tags (
    id bigserial primary key,
    name varchar(80) not null,
    slug varchar(100) not null,
    created_at timestamp not null,
    updated_at timestamp not null,
    constraint uq_blog_tag_name unique (name),
    constraint uq_blog_tag_slug unique (slug)
);

create table blog_posts (
    id bigserial primary key,
    title varchar(220) not null,
    slug varchar(240) not null,
    excerpt varchar(600) not null,
    content_json jsonb not null,
    content_html text,
    cover_image_key varchar(500),
    cover_image_url text,
    cover_image_alt varchar(220),
    status varchar(30) not null default 'DRAFT',
    featured boolean not null default false,
    author_id bigint not null references users(id),
    category_id bigint references blog_categories(id) on delete set null,
    seo_title varchar(220),
    meta_description varchar(320),
    published_at timestamp,
    created_at timestamp not null,
    updated_at timestamp not null,
    constraint uq_blog_post_slug unique (slug),
    constraint chk_blog_post_status check (status in ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'))
);

create table blog_post_tags (
    post_id bigint not null references blog_posts(id) on delete cascade,
    tag_id bigint not null references blog_tags(id) on delete cascade,
    primary key (post_id, tag_id)
);

create table blog_post_products (
    post_id bigint not null references blog_posts(id) on delete cascade,
    product_id bigint not null references products(id),
    primary key (post_id, product_id)
);

create index idx_blog_posts_public on blog_posts(status, published_at desc);
create index idx_blog_posts_category on blog_posts(category_id);
create index idx_blog_post_tags_tag on blog_post_tags(tag_id);
create index idx_blog_post_products_product on blog_post_products(product_id);

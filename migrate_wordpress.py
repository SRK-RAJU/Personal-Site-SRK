#!/usr/bin/env python3
"""
WordPress to Supabase Migration Script
======================================

This script extracts WordPress data from SQL export and converts it to Supabase format.

Usage:
    1. Download wordpress_backup.sql from WordPress phpMyAdmin
    2. Place it in the same folder as this script
    3. Run: python migrate_wordpress.py
    4. Use the generated supabase_migration.sql in Supabase

Requirements:
    - Python 3.6+
    - No external libraries needed!
"""

import re
import json
from datetime import datetime
import sys

def extract_posts_from_sql(sql_file):
    """Extract all WordPress posts from SQL export file"""
    
    print(f"📖 Reading {sql_file}...")
    
    try:
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: {sql_file} not found!")
        print("   Please make sure wordpress_backup.sql exists in this folder")
        sys.exit(1)
    
    # Find any posts table INSERT (handles different table prefixes)
    pattern = r"INSERT INTO `[^`]*posts` VALUES\s*(\(.*?\));"
    matches = re.findall(pattern, content, re.DOTALL)
    
    if not matches:
        print("❌ No WordPress posts table found in SQL file!")
        print("   Make sure you exported the correct database")
        sys.exit(1)
    
    posts = []
    post_count = 0
    
    # Parse each row
    for match in matches:
        # Split by parentheses to get individual rows
        rows = re.findall(r'\([^)]+\)', match, re.DOTALL)
        
        for row in rows:
            post_count += 1
            # Clean up the row
            row = row.strip('()')
            
            # Parse values (handle quoted strings with commas)
            values = parse_sql_values(row)
            
            if len(values) >= 23:
                # WordPress wp_posts fields:
                # 0: ID, 1: post_author, 2: post_date, 3: post_date_gmt
                # 4: post_content, 5: post_title, 6: post_excerpt
                # 7: post_status, 8: comment_status, 9: ping_status
                # 10: post_password, 11: post_name, 12: to_ping, 13: pinged
                # 14: post_modified, 15: post_modified_gmt, 16: post_content_filtered
                # 17: post_parent, 18: guid, 19: menu_order
                # 20: post_type, 21: post_mime_type, 22: comment_count
                
                post_type = values[20].lower() if len(values) > 20 else 'post'
                post_status = values[7].lower() if len(values) > 7 else 'draft'
                
                # Only include published posts and pages
                if post_status == 'publish' and post_type in ['post', 'page']:
                    post_data = {
                        'id': values[0],
                        'post_date': values[2] if len(values) > 2 else '2024-01-01',
                        'post_content': values[4] if len(values) > 4 else '',
                        'post_title': values[5] if len(values) > 5 else 'Untitled',
                        'post_name': values[11] if len(values) > 11 else '',
                        'post_excerpt': values[6] if len(values) > 6 else '',
                        'post_type': post_type,
                        'post_status': post_status
                    }
                    
                    # Validate required fields
                    if post_data['post_title'] and post_data['post_content']:
                        posts.append(post_data)
    
    print(f"✅ Found {len(posts)} published posts/pages")
    return posts

def parse_sql_values(row):
    """Parse SQL row values, handling quoted strings"""
    values = []
    current_value = ''
    in_quotes = False
    i = 0
    
    while i < len(row):
        char = row[i]
        
        if char == "'" and (i == 0 or row[i-1] != '\\'):
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            values.append(current_value.strip().strip("'"))
            current_value = ''
            i += 1
            continue
        
        current_value += char
        i += 1
    
    # Add last value
    if current_value:
        values.append(current_value.strip().strip("'"))
    
    return values

def sanitize_for_sql(text):
    """Sanitize text for SQL insertion"""
    if not text:
        return ''
    # Escape single quotes
    text = text.replace("'", "''")
    # Remove problematic characters
    text = text.replace('\r', '').replace('\n', ' ')
    return text[:5000]  # Limit to 5000 chars

def generate_supabase_sql(posts):
    """Generate Supabase-compatible SQL"""
    
    sql = """-- ============================================
-- WordPress to Supabase Migration
-- ============================================
-- Created: {}
-- Total Posts: {}
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Run this first to get user ID:
--
--    INSERT INTO users (email, password_hash, name, role)
--    VALUES ('admin@yoursite.com', 'temp_password_123', 'Admin', 'ADMIN');
--    SELECT id FROM users WHERE email = 'admin@yoursite.com';
--
-- 3. Copy the user ID UUID from above
-- 4. Replace 'USER_ID_HERE' below with that UUID
-- 5. Run this entire script
-- ============================================

-- Insert all posts
INSERT INTO posts (title, slug, content, excerpt, author_id, is_published, published_at) VALUES
""".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), len(posts))
    
    for i, post in enumerate(posts):
        title = sanitize_for_sql(post['post_title'])
        slug = post['post_name'] or title.lower().replace(' ', '-').replace("'", '')[:50]
        slug = slug[:50]  # Limit slug length
        content = sanitize_for_sql(post['post_content'])
        excerpt = sanitize_for_sql(post['post_excerpt']) or title[:100]
        
        # Extract date
        date_str = post['post_date'].split()[0] if post['post_date'] else '2024-01-01'
        
        # Add comma if not last item
        comma = "," if i < len(posts) - 1 else ";"
        
        sql += f"\n('{title}', '{slug}', '{content}', '{excerpt}', 'USER_ID_HERE'::UUID, true, '{date_str}'){comma}"
    
    sql += """

-- ============================================
-- Verify Migration
-- ============================================

-- Check total posts imported
-- SELECT COUNT(*) as total_posts FROM posts;

-- Check specific post
-- SELECT title, slug, created_at FROM posts LIMIT 10;

-- Check for any issues
-- SELECT title FROM posts WHERE content = '' OR title = '';

-- ============================================
-- After Verification:
-- ============================================
-- 1. Test your site at http://localhost:3000/blog
-- 2. Verify all posts show up
-- 3. Check images load correctly
-- 4. Delete old WordPress folder when satisfied
-- ============================================
"""
    
    return sql

def main():
    """Main migration workflow"""
    
    print("\n" + "="*50)
    print("🔄 WordPress to Supabase Migrator")
    print("="*50 + "\n")
    
    # Step 1: Extract posts
    posts = extract_posts_from_sql('wordpress_backup.sql')
    
    if not posts:
        print("❌ No posts found to migrate!")
        sys.exit(1)
    
    # Step 2: Generate SQL
    print(f"📝 Generating Supabase SQL...")
    sql_output = generate_supabase_sql(posts)
    
    # Step 3: Save SQL file
    with open('supabase_migration.sql', 'w', encoding='utf-8') as f:
        f.write(sql_output)
    print("✅ SQL file created: supabase_migration.sql")
    
    # Step 4: Create JSON preview
    preview_data = {
        'migration_date': datetime.now().isoformat(),
        'total_posts': len(posts),
        'sample_posts': posts[:3]
    }
    
    with open('migration_preview.json', 'w', encoding='utf-8') as f:
        json.dump(preview_data, f, indent=2, ensure_ascii=False)
    print("✅ Preview file created: migration_preview.json")
    
    # Step 5: Summary
    print("\n" + "="*50)
    print("✨ Migration Summary")
    print("="*50)
    print(f"Total Posts: {len(posts)}")
    print(f"\nNext Steps:")
    print(f"1. Go to Supabase Dashboard → SQL Editor")
    print(f"2. Create admin user and get UUID")
    print(f"3. Open supabase_migration.sql")
    print(f"4. Replace 'USER_ID_HERE' with your UUID")
    print(f"5. Run the SQL")
    print(f"6. Verify at http://localhost:3000/blog")
    print("="*50 + "\n")

if __name__ == '__main__':
    main()

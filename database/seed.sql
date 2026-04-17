USE railway;

SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM content_report;
DELETE FROM spot_media;
DELETE FROM spot_hours;
DELETE FROM spot_attributes;
DELETE FROM favorites;
DELETE FROM reviews;
DELETE FROM spots;
DELETE FROM users;
DELETE FROM attribute_menu;
DELETE FROM roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ======================
-- ROLES
-- ======================
INSERT INTO roles (role_id, role_name) VALUES
(1, 'admin'),
(2, 'user'),
(3, 'moderator'),
(4, 'owner'),
(5, 'guest');

-- ======================
-- ATTRIBUTE MENU
-- ======================
INSERT INTO attribute_menu (attribute_id, name) VALUES
(1, 'WiFi'),
(2, 'Parking'),
(3, 'Outdoor Seating'),
(4, 'Pet Friendly'),
(5, 'Study Friendly');

-- ======================
-- USERS
-- ======================
INSERT INTO users (
    user_id,
    display_name,
    email,
    avatar_url,
    password_hash,
    last_login,
    is_active,
    deleted_at,
    role_id
) VALUES
(1, 'Liam Erickson', 'liam@vt.edu', 'https://example.com/users/1/avatars/liam-erickson.jpg', 'hash1', '2026-04-15 08:30:00', 1, NULL, 1),
(2, 'Sarah Collins', 'sarah@vt.edu', 'https://example.com/users/2/avatars/sarah-collins.jpg', 'hash2', '2026-04-14 21:15:00', 1, NULL, 2),
(3, 'Marcus Lee', 'marcus@vt.edu', 'https://example.com/users/3/avatars/marcus-lee.jpg', 'hash3', '2026-04-15 10:05:00', 1, NULL, 3),
(4, 'Emma Carter', 'emma@vt.edu', 'https://example.com/users/4/avatars/emma-carter.jpg', 'hash4', '2026-04-13 17:20:00', 1, NULL, 2),
(5, 'Noah Bennett', 'noah@vt.edu', 'https://example.com/users/5/avatars/noah-bennett.jpg', 'hash5', '2026-04-12 09:45:00', 1, NULL, 4);

-- ======================
-- SPOTS
-- ======================
INSERT INTO spots
(spot_id, parent_spot_id, spot_type, spot_name, short_description, address, latitude, longitude, user_id, status)
VALUES
(1, NULL, 'Coffee Shop', 'Mill Mountain Coffee - Blacksburg', 'Popular coffee spot for studying and casual meetups.', '225 N Main St, Blacksburg, VA', 37.2314, -80.4139, 1, 'active'),
(2, NULL, 'Restaurant', 'Benny Marzano''s', 'Late-night pizza favorite near campus.', '110 Draper Rd NW, Blacksburg, VA', 37.2298, -80.4147, 2, 'active'),
(3, NULL, 'Library', 'Newman Library', 'Main Virginia Tech library with lots of study space.', '560 Drillfield Dr, Blacksburg, VA', 37.2284, -80.4234, 3, 'active'),
(4, NULL, 'Outdoor Space', 'Drillfield', 'Open campus green space in the center of Virginia Tech.', 'Drillfield, Virginia Tech, Blacksburg, VA', 37.2295, -80.4218, 4, 'active'),
(5, NULL, 'Cafe', 'Deet''s Place', 'Campus coffee shop good for quick drinks and studying.', 'Owens Hall, Virginia Tech, Blacksburg, VA', 37.2248, -80.4227, 5, 'active');

-- ======================
-- REVIEWS
-- ======================
INSERT INTO reviews (review_id, spot_id, user_id, rating, review) VALUES
(1, 1, 2, 5, 'Really good coffee and a solid place to sit and get work done.'),
(2, 2, 1, 4, 'Great pizza especially late at night, but it can get crowded.'),
(3, 3, 4, 5, 'Best study spot on campus with lots of space and resources.'),
(4, 4, 5, 4, 'Nice place to hang out when the weather is good.'),
(5, 5, 3, 4, 'Convenient on-campus coffee stop and usually easy to grab something quickly.');

-- ======================
-- FAVORITES
-- ======================
INSERT INTO favorites (user_id, spot_id) VALUES
(1, 3),
(2, 1),
(3, 5),
(4, 4),
(5, 2);

-- ======================
-- SPOT ATTRIBUTES
-- ======================
INSERT INTO spot_attributes (spot_attribute_id, attribute_id, spot_id, value, notes) VALUES
(1, 1, 1, 'Yes', 'Reliable WiFi for working on assignments'),
(2, 3, 1, 'Yes', 'Some outdoor seating available'),
(3, 5, 3, 'Yes', 'Quiet floors and lots of study areas'),
(4, 2, 2, 'Limited', 'Parking nearby but can be difficult at busy times'),
(5, 5, 5, 'Yes', 'Good quick study stop between classes');

-- ======================
-- SPOT HOURS
-- ======================
INSERT INTO spot_hours (hours_id, spot_id, days_of_week, open_time, close_time, notes) VALUES
(1, 1, 'Mon-Fri', '07:00:00', '19:00:00', 'Hours may vary during breaks'),
(2, 2, 'Daily', '11:00:00', '23:59:00', 'Popular late-night option'),
(3, 3, 'Daily', '07:00:00', '23:00:00', 'Can vary during exam periods'),
(4, 4, 'Daily', NULL, NULL, 'Open outdoor public space'),
(5, 5, 'Mon-Fri', '08:00:00', '17:00:00', 'Mostly busiest during class hours');

-- ======================
-- SPOT MEDIA
-- ======================
INSERT INTO spot_media (
    media_id,
    spot_id,
    user_id,
    storage_path,
    file_name,
    media_url,
    mime_type,
    file_size_bytes,
    width,
    height,
    sort_order,
    is_primary
) VALUES
(1, 1, 1, 'spots/1/images/1713180000000-mill-mountain-coffee.jpg', 'mill-mountain-coffee.jpg', 'https://example.com/spots/1/images/mill-mountain-coffee.jpg', 'image/jpeg', 245120, 1600, 1200, 0, 1),
(2, 2, 2, 'spots/2/images/1713180001000-benny-marzanos.jpg', 'benny-marzanos.jpg', 'https://example.com/spots/2/images/benny-marzanos.jpg', 'image/jpeg', 231552, 1600, 1200, 0, 1),
(3, 3, 3, 'spots/3/images/1713180002000-newman-library.jpg', 'newman-library.jpg', 'https://example.com/spots/3/images/newman-library.jpg', 'image/jpeg', 301056, 1600, 1200, 0, 1),
(4, 4, 4, 'spots/4/images/1713180003000-drillfield.jpg', 'drillfield.jpg', 'https://example.com/spots/4/images/drillfield.jpg', 'image/jpeg', 196608, 1600, 1200, 0, 1),
(5, 5, 5, 'spots/5/images/1713180004000-deets-place.jpg', 'deets-place.jpg', 'https://example.com/spots/5/images/deets-place.jpg', 'image/jpeg', 212992, 1600, 1200, 0, 1);

-- ======================
-- CONTENT REPORT
-- ======================
INSERT INTO content_report
(report_id, user_id, review_id, spot_id, reason, details, status, resolution_note)
VALUES
(1, 1, 2, NULL, 'Spam', 'This review seems overly repetitive and possibly not genuine.', 'open', NULL),
(2, 2, NULL, 4, 'Incorrect Info', 'The listed hours do not really apply because this is an outdoor space.', 'open', NULL),
(3, 3, 5, NULL, 'Off Topic', 'Review talks more about class schedule than the actual spot.', 'resolved', 'Reviewed and left visible'),
(4, 4, NULL, 2, 'Duplicate', 'This spot may have been entered twice by mistake.', 'open', NULL),
(5, 5, 1, NULL, 'Other', 'Just wanted moderator review on whether this is promotional.', 'open', NULL);

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
-- ATTRIBUTE MENU
-- ======================
INSERT INTO attribute_menu (
    attribute_id,
    name,
    attribute_type,
    allowed_values_json,
    number_unit,
    min_value,
    max_value,
    help_text,
    is_active
) VALUES
(1, 'Wi-Fi', 'boolean', JSON_ARRAY('Yes', 'No'), NULL, NULL, NULL, 'Whether the spot offers usable Wi-Fi.', 1),
(2, 'Noise Level', 'single_choice', JSON_ARRAY('Low', 'Medium', 'High'), NULL, NULL, NULL, 'How noisy the spot usually feels while studying.', 1),
(3, 'Power Outlets', 'single_choice', JSON_ARRAY('None', 'Limited', 'Many'), NULL, NULL, NULL, 'Availability of nearby power outlets.', 1);

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
(spot_id, parent_spot_id, hierarchy_type, spot_type, spot_name, short_description, address, latitude, longitude, user_id, status)
VALUES
(1, NULL, 'standalone', 'Coffee Shop', 'Mill Mountain Coffee - Blacksburg', 'Popular coffee spot for studying and casual meetups.', '225 N Main St, Blacksburg, VA', 37.2314, -80.4139, 1, 'active'),
(2, NULL, 'standalone', 'Restaurant', 'Benny Marzano''s', 'Late-night pizza favorite near campus.', '110 Draper Rd NW, Blacksburg, VA', 37.2298, -80.4147, 2, 'active'),
(3, NULL, 'building', 'Library', 'Newman Library', 'Main Virginia Tech library with lots of study space.', '560 Drillfield Dr, Blacksburg, VA', 37.2284, -80.4234, 3, 'active'),
(4, NULL, 'standalone', 'Outdoor Space', 'Drillfield', 'Open campus green space in the center of Virginia Tech.', 'Drillfield, Virginia Tech, Blacksburg, VA', 37.2295, -80.4218, 4, 'active'),
(5, NULL, 'standalone', 'Cafe', 'Deet''s Place', 'Campus coffee shop good for quick drinks and studying.', 'Owens Hall, Virginia Tech, Blacksburg, VA', 37.2248, -80.4227, 5, 'active'),
(6, 3, 'floor', 'Library', 'Newman Library - 4th Floor', 'Quiet floor with individual desks and strong natural light.', '560 Drillfield Dr, Blacksburg, VA', 37.2284, -80.4234, 3, 'active'),
(7, 6, 'room', 'Library', 'Newman Library Room 402', 'Reservable room with whiteboards and strong Wi-Fi.', '560 Drillfield Dr, Blacksburg, VA', 37.2284, -80.4234, 3, 'active');

-- ======================
-- REVIEWS
-- ======================
INSERT INTO reviews (review_id, spot_id, user_id, rating, review) VALUES
(1, 1, 2, 5, 'Really good coffee and a solid place to sit and get work done.'),
(2, 2, 1, 4, 'Great pizza especially late at night, but it can get crowded.'),
(3, 3, 4, 5, 'Best study spot on campus with lots of space and resources.'),
(4, 4, 5, 4, 'Nice place to hang out when the weather is good.'),
(5, 5, 3, 4, 'Convenient on-campus coffee stop and usually easy to grab something quickly.'),
(6, 6, 1, 5, 'One of the quietest floors in Newman for long study sessions.'),
(7, 7, 2, 4, 'Useful room for small group work when it is available.');

-- ======================
-- FAVORITES
-- ======================
INSERT INTO favorites (user_id, spot_id) VALUES
(1, 3),
(2, 1),
(3, 5),
(4, 4),
(5, 2),
(1, 6),
(2, 7);

-- ======================
-- SPOT ATTRIBUTES
-- ======================
INSERT INTO spot_attributes (
    spot_attribute_id,
    attribute_id,
    spot_id,
    value,
    notes,
    submitted_name,
    submitted_type,
    submitted_value,
    submitted_notes,
    moderation_status
) VALUES
(1, 1, 1, 'Yes', 'Reliable Wi-Fi for working on assignments', NULL, NULL, NULL, NULL, 'approved'),
(2, 2, 1, 'Medium', 'Can get busier around lunch', NULL, NULL, NULL, NULL, 'approved'),
(3, 4, 3, 'Yes', 'Quiet floors and lots of study areas', NULL, NULL, NULL, NULL, 'approved'),
(4, 3, 2, 'Limited', 'Some wall outlets, but they fill up fast', NULL, NULL, NULL, NULL, 'approved'),
(5, 2, 5, 'Low', 'Usually calm between classes', NULL, NULL, NULL, NULL, 'approved'),
(6, 4, 6, 'Yes', 'Quiet floor with lots of individual seating', NULL, NULL, NULL, NULL, 'approved'),
(7, 1, 7, 'Yes', 'Reliable connection for study groups', NULL, NULL, NULL, NULL, 'approved');

-- ======================
-- SPOT HOURS
-- ======================
INSERT INTO spot_hours (hours_id, spot_id, days_of_week, open_time, close_time, notes) VALUES
(1, 1, 'Mon-Fri', '07:00:00', '19:00:00', 'Hours may vary during breaks'),
(2, 2, 'Daily', '11:00:00', '23:59:00', 'Popular late-night option'),
(3, 3, 'Daily', '07:00:00', '23:00:00', 'Can vary during exam periods'),
(4, 4, 'Daily', NULL, NULL, 'Open outdoor public space'),
(5, 5, 'Mon-Fri', '08:00:00', '17:00:00', 'Mostly busiest during class hours'),
(6, 6, 'Daily', '07:00:00', '23:00:00', 'Matches Newman Library access hours'),
(7, 7, 'Mon-Fri', '08:00:00', '22:00:00', 'Room access depends on reservations');

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
(5, 5, 5, 'spots/5/images/1713180004000-deets-place.jpg', 'deets-place.jpg', 'https://example.com/spots/5/images/deets-place.jpg', 'image/jpeg', 212992, 1600, 1200, 0, 1),
(6, 6, 3, 'spots/6/images/1713180005000-newman-library-floor-4.jpg', 'newman-library-floor-4.jpg', 'https://example.com/spots/6/images/newman-library-floor-4.jpg', 'image/jpeg', 254000, 1600, 1200, 0, 1),
(7, 7, 3, 'spots/7/images/1713180006000-newman-library-room-402.jpg', 'newman-library-room-402.jpg', 'https://example.com/spots/7/images/newman-library-room-402.jpg', 'image/jpeg', 223500, 1600, 1200, 0, 1);

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

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
DELETE FROM attribute_menu;

ALTER TABLE content_report AUTO_INCREMENT = 1;
ALTER TABLE spot_hours AUTO_INCREMENT = 1;
ALTER TABLE spot_attributes AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE spots AUTO_INCREMENT = 1;
ALTER TABLE attribute_menu AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Existing users from schema.sql are preserved.
-- User IDs available for seeded relationships: 1, 2, 3, 4.
-- spot_media is intentionally left empty.

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
    is_active,
    created_by_user_id,
    last_updated_by_user_id
) VALUES
(1, 'Wi-Fi', 'boolean', JSON_ARRAY('Yes', 'No'), NULL, NULL, NULL, 'Whether the spot has usable internet for coursework or meetings.', 1, 1, 1),
(2, 'Noise Level', 'single_choice', JSON_ARRAY('Low', 'Medium', 'High'), NULL, NULL, NULL, 'Typical noise level during normal operating hours.', 1, 1, 1),
(3, 'Power Outlets', 'single_choice', JSON_ARRAY('None', 'Limited', 'Many'), NULL, NULL, NULL, 'How easy it is to find an outlet nearby.', 1, 1, 1),
(4, 'Seating Capacity', 'number', NULL, 'seats', 1, 500, 'Approximate number of seats reasonably available.', 1, 1, 1),
(5, 'Indoor/Outdoor', 'single_choice', JSON_ARRAY('Indoor', 'Outdoor', 'Both'), NULL, NULL, NULL, 'Whether the seating is indoors, outdoors, or both.', 1, 1, 1),
(6, 'Study-Friendly', 'boolean', JSON_ARRAY('Yes', 'No'), NULL, NULL, NULL, 'Whether the spot works well for focused studying.', 1, 1, 1),
(7, 'Parking', 'single_choice', JSON_ARRAY('None', 'Street', 'Lot', 'Garage'), NULL, NULL, NULL, 'Most practical parking option nearby.', 1, 1, 1),
(8, 'Food Available', 'boolean', JSON_ARRAY('Yes', 'No'), NULL, NULL, NULL, 'Whether food can be purchased directly at the spot.', 1, 1, 1),
(9, 'Reservation Needed', 'boolean', JSON_ARRAY('Yes', 'No'), NULL, NULL, NULL, 'Whether access usually depends on a reservation or booking.', 1, 1, 1),
(10, 'Accessibility', 'single_choice', JSON_ARRAY('Fully Accessible', 'Partially Accessible', 'Limited Info'), NULL, NULL, NULL, 'How accessible the location appears from a student perspective.', 1, 1, 1),
(11, 'Best For', 'text', NULL, NULL, NULL, NULL, 'Short freeform guidance on the best use case for the spot.', 1, 1, 1),
(12, 'Printer Access', 'boolean', JSON_ARRAY('Yes', 'No'), NULL, NULL, NULL, 'Whether students can easily access a printer nearby.', 0, 1, 1);

-- ======================
-- SPOTS
-- ======================
INSERT INTO spots (
    spot_id,
    parent_spot_id,
    hierarchy_type,
    spot_type,
    spot_name,
    short_description,
    address,
    latitude,
    longitude,
    user_id,
    created_at,
    last_modified,
    status
) VALUES
(1, NULL, 'standalone', 'cafe', 'Mill Mountain Coffee & Tea', 'Downtown Blacksburg coffee shop with dependable Wi-Fi, window seating, and a steady mix of students and locals.', '225 N Main St, Blacksburg, VA 24060', 37.230870, -80.416010, 1, '2026-02-03 08:15:00', '2026-04-10 09:05:00', 'active'),
(2, NULL, 'building', 'library', 'Newman Library', 'Virginia Tech''s main library with multiple quiet zones, reservable rooms, and long operating hours.', '560 Drillfield Dr, Blacksburg, VA 24061', 37.228370, -80.423430, 2, '2026-01-15 11:20:00', '2026-04-08 14:10:00', 'active'),
(3, 2, 'floor', 'library', 'Newman Library 4th Floor Quiet Study', 'A quieter floor inside Newman that students use for deep-focus work, solo study, and long laptop sessions.', '560 Drillfield Dr, Blacksburg, VA 24061', 37.228370, -80.423430, 2, '2026-01-16 12:10:00', '2026-04-08 14:12:00', 'active'),
(4, 3, 'room', 'library', 'Newman Library Group Study Room 416', 'Small reservable room with a whiteboard, screen, and enough space for a project team.', '560 Drillfield Dr, Blacksburg, VA 24061', 37.228370, -80.423430, 3, '2026-01-18 15:00:00', '2026-04-02 16:40:00', 'active'),
(5, NULL, 'standalone', 'other', 'Torgersen Hall Bridge', 'Popular Virginia Tech indoor crossover space with lots of foot traffic, fast internet, and short-session seating.', '620 Drillfield Dr, Blacksburg, VA 24061', 37.229840, -80.421960, 3, '2026-02-01 10:30:00', '2026-04-09 12:25:00', 'active'),
(6, NULL, 'standalone', 'park', 'Drillfield', 'Central open lawn at Virginia Tech that works best for breaks, sunny reading, and informal meetups outdoors.', 'Drillfield, Blacksburg, VA 24061', 37.229520, -80.421360, 4, '2026-02-05 13:45:00', '2026-04-22 18:20:00', 'active'),
(7, NULL, 'standalone', 'restaurant', 'The Maroon Door', 'On-campus dining option in Squires with tables that can work for quick work sessions between classes.', '290 College Ave, Blacksburg, VA 24060', 37.229130, -80.417640, 1, '2026-04-11 11:05:00', '2026-04-12 10:10:00', 'pending'),
(8, NULL, 'standalone', 'library', 'Blacksburg Library', 'Public library branch with quieter reading areas, outlets, and a less crowded feel than central campus.', '200 Miller St SE, Blacksburg, VA 24060', 37.231300, -80.419210, 4, '2026-01-24 09:50:00', '2026-03-30 17:35:00', 'active'),
(9, NULL, 'standalone', 'office', 'North End Center Atrium', 'Professional-feeling indoor atrium at the Corporate Research Center that works well for quiet laptop work and meetings.', '300 Turner St NW, Blacksburg, VA 24060', 37.236200, -80.420600, 2, '2026-02-10 08:40:00', '2026-04-19 08:05:00', 'active'),
(10, NULL, 'standalone', 'other', 'Squires Student Center 2nd Floor Lounge', 'Student-center seating area near event spaces and dining that can be convenient when open but is inconsistent during busy programming days.', '290 College Ave, Blacksburg, VA 24060', 37.229200, -80.417700, 3, '2026-01-28 16:20:00', '2026-03-29 13:00:00', 'inactive'),
(11, NULL, 'standalone', 'cafe', 'Coffeeholics Cafe & Bakery', 'Christiansburg cafe with pastries, tables, and a calmer atmosphere for casual work away from campus.', '2955 Market St NE, Christiansburg, VA 24073', 37.155210, -80.410870, 4, '2026-02-14 09:25:00', '2026-04-05 10:45:00', 'active'),
(12, NULL, 'standalone', 'park', 'Huckleberry Trail - Christiansburg Library Access Point', 'Trail-adjacent outdoor stop near the library that could work for reading, walking breaks, or short outdoor laptop sessions.', '125 Sheltman St, Christiansburg, VA 24073', 37.129780, -80.409330, 1, '2026-04-17 07:55:00', '2026-04-21 09:10:00', 'pending'),
(13, NULL, 'standalone', 'other', 'Graduate Life Center Reading Room', 'A quieter Virginia Tech indoor room that works for reading and solo work, but currently has no attribute submissions yet.', '155 Otey St, Blacksburg, VA 24060', 37.226820, -80.418930, 2, '2026-04-06 08:25:00', '2026-04-18 07:50:00', 'active'),
(14, NULL, 'standalone', 'office', 'Moss Arts Center Lobby Tables', 'Open indoor seating around the Moss Arts Center that can be useful for short laptop sessions, though hours have not been added yet.', '190 Alumni Mall, Blacksburg, VA 24061', 37.231910, -80.418270, 1, '2026-04-07 10:05:00', '2026-04-18 09:45:00', 'active'),
(15, NULL, 'standalone', 'restaurant', 'Turner Place Dining Hall Seating', 'Large indoor dining hall seating area that some students still use for work even though this listing has been marked inactive.', '117 Otey St, Blacksburg, VA 24061', 37.224960, -80.420540, 4, '2026-03-08 12:10:00', '2026-04-16 14:20:00', 'inactive'),
(16, NULL, 'standalone', 'park', 'Caboose Park Picnic Tables', 'Small Christiansburg outdoor seating area that is currently inactive and does not yet have hours or reviews.', '120 Depot St NE, Christiansburg, VA 24073', 37.130910, -80.408210, 3, '2026-04-08 09:10:00', '2026-04-18 11:35:00', 'inactive');

-- ======================
-- REVIEWS
-- ======================
INSERT INTO reviews (
    review_id,
    spot_id,
    user_id,
    rating,
    review,
    created_at,
    deleted_at,
    deletion_note
) VALUES
(1, 1, 2, 4.5, 'Reliable place for a morning study block. The Wi-Fi held up through a long Zoom call and I could usually find an outlet.', '2026-04-03 09:10:00', NULL, NULL),
(2, 1, 3, 5.0, 'Great coffee, good light near the front windows, and enough background noise that it never feels awkward to stay awhile.', '2026-04-14 08:35:00', NULL, NULL),
(3, 2, 4, 5.0, 'Still one of the most dependable places on campus when I need a long work session. Plenty of seating and easy access to resources.', '2026-04-15 19:20:00', NULL, NULL),
(4, 3, 1, 5.0, 'The fourth floor is where I go when I need quiet. It is noticeably calmer than the lower floors and the outlets are easy to find.', '2026-03-21 14:05:00', NULL, NULL),
(5, 4, 2, 4.0, 'Solid room for a four-person team meeting. Reservation timing matters, but the setup is convenient once you are in.', '2026-03-25 16:40:00', NULL, NULL),
(6, 5, 3, 4.5, 'Good for short sessions between classes. It is busy and not truly quiet, but the location is hard to beat.', '2026-04-06 11:55:00', NULL, NULL),
(7, 6, 1, 4.0, 'Best on a mild afternoon. I would not treat it like a primary study spot, but it is great for reading and resetting between tasks.', '2026-04-02 17:15:00', NULL, NULL),
(8, 8, 4, 4.5, 'A nice alternative when campus feels packed. The atmosphere is quieter and I have had better luck getting a large table here.', '2026-02-18 13:10:00', NULL, NULL),
(9, 9, 2, 4.0, 'Professional vibe, comfortable seating, and usually quieter than student-heavy spots. Best if you already have business in the area.', '2026-04-18 09:25:00', NULL, NULL),
(10, 11, 1, 4.5, 'Good pastries, enough seating, and less campus traffic than Blacksburg coffee shops. Nice option when I want a change of scenery.', '2026-04-04 10:30:00', NULL, NULL),
(11, 10, 3, 2.0, 'This place is useless and nobody should ever go here because it is basically impossible to get anything done.', '2026-03-26 12:00:00', '2026-03-28 09:30:00', 'Removed by admin moderation'),
(12, 8, 2, 3.5, 'Quiet overall, but a few of the table areas fill up faster than expected after school gets out.', '2026-01-30 15:45:00', NULL, NULL),
(13, 15, 1, 3.5, 'There is plenty of seating, but it can be loud and inconsistent enough that I understand why this listing is currently inactive.', '2026-04-10 12:25:00', NULL, NULL),
(14, 15, 2, 3.0, 'Useful in a pinch for group meetups, though I would not count on it as a steady study spot anymore.', '2026-04-12 18:10:00', NULL, NULL);

-- ======================
-- FAVORITES
-- ======================
INSERT INTO favorites (
    user_id,
    spot_id,
    created_at
) VALUES
(1, 2, '2026-03-01 08:00:00'),
(1, 3, '2026-03-01 08:05:00'),
(1, 11, '2026-04-04 11:00:00'),
(2, 1, '2026-04-03 09:20:00'),
(2, 8, '2026-02-20 17:10:00'),
(3, 5, '2026-04-06 12:10:00'),
(3, 9, '2026-04-18 10:05:00'),
(4, 2, '2026-03-10 14:30:00'),
(4, 6, '2026-04-02 17:20:00'),
(4, 11, '2026-04-05 08:50:00');

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
    submitted_allowed_values_json,
    moderation_status,
    moderation_reason,
    reviewed_at,
    reviewed_by_user_id,
    created_at
) VALUES
(1, 1, 1, 'Yes', 'Wi-Fi was stable during video calls and LMS usage.', NULL, NULL, 'Yes', 'Wi-Fi was stable during video calls and LMS usage.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:30:00'),
(2, 2, 1, 'Medium', 'Usually lively without becoming overwhelming.', NULL, NULL, 'Medium', 'Usually lively without becoming overwhelming.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:31:00'),
(3, 3, 1, 'Many', 'Outlets are easiest to find along the walls.', NULL, NULL, 'Many', 'Outlets are easiest to find along the walls.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:32:00'),
(4, 4, 1, '42', 'Approximate indoor seating count.', NULL, NULL, '42', 'Approximate indoor seating count.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:33:00'),
(5, 5, 1, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:34:00'),
(6, 6, 1, 'Yes', 'Works well for solo study outside lunch rush.', NULL, NULL, 'Yes', 'Works well for solo study outside lunch rush.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:35:00'),
(7, 7, 1, 'Street', 'Metered and street parking nearby.', NULL, NULL, 'Street', 'Metered and street parking nearby.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:36:00'),
(8, 8, 1, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:37:00'),
(9, 10, 1, 'Partially Accessible', 'Entrance is manageable, but table layout can tighten during busy hours.', NULL, NULL, 'Partially Accessible', 'Entrance is manageable, but table layout can tighten during busy hours.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:38:00'),
(10, 11, 1, 'Solo study', 'Best if you want coffee and a moderate level of background activity.', NULL, NULL, 'Solo study', 'Best if you want coffee and a moderate level of background activity.', NULL, 'approved', NULL, NULL, NULL, '2026-02-03 08:39:00'),

(11, 1, 2, 'Yes', 'Campus Wi-Fi is reliable throughout the building.', NULL, NULL, 'Yes', 'Campus Wi-Fi is reliable throughout the building.', NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:30:00'),
(12, 2, 2, 'Low', 'Noise level depends on floor, but the building overall supports study well.', NULL, NULL, 'Low', 'Noise level depends on floor, but the building overall supports study well.', NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:31:00'),
(13, 3, 2, 'Many', 'Outlets are distributed across multiple study areas.', NULL, NULL, 'Many', 'Outlets are distributed across multiple study areas.', NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:32:00'),
(14, 4, 2, '450', 'Across reading rooms, common areas, and desks.', NULL, NULL, '450', 'Across reading rooms, common areas, and desks.', NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:33:00'),
(15, 5, 2, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:34:00'),
(16, 6, 2, 'Yes', 'One of the strongest all-around study spots in town.', NULL, NULL, 'Yes', 'One of the strongest all-around study spots in town.', NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:35:00'),
(17, 7, 2, 'Garage', 'Parking is easiest if you already have campus access.', NULL, NULL, 'Garage', 'Parking is easiest if you already have campus access.', NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:36:00'),
(18, 10, 2, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:37:00'),
(19, 11, 2, 'Quiet study, research, long sessions', NULL, NULL, NULL, 'Quiet study, research, long sessions', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-15 11:38:00'),

(20, 2, 3, 'Low', 'Noticeably quieter than the busier lower levels.', NULL, NULL, 'Low', 'Noticeably quieter than the busier lower levels.', NULL, 'approved', NULL, NULL, NULL, '2026-01-16 12:20:00'),
(21, 3, 3, 'Many', 'Desks and perimeter seating both have good outlet access.', NULL, NULL, 'Many', 'Desks and perimeter seating both have good outlet access.', NULL, 'approved', NULL, NULL, NULL, '2026-01-16 12:21:00'),
(22, 4, 3, '140', 'Estimated seats on the fourth floor study area.', NULL, NULL, '140', 'Estimated seats on the fourth floor study area.', NULL, 'approved', NULL, NULL, NULL, '2026-01-16 12:22:00'),
(23, 6, 3, 'Yes', 'Best for focused individual work.', NULL, NULL, 'Yes', 'Best for focused individual work.', NULL, 'approved', NULL, NULL, NULL, '2026-01-16 12:23:00'),
(24, 10, 3, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-16 12:24:00'),
(25, 11, 3, 'Deep work and exam prep', NULL, NULL, NULL, 'Deep work and exam prep', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-16 12:25:00'),

(26, 1, 4, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:10:00'),
(27, 2, 4, 'Low', 'Usually quiet unless the hallway is active.', NULL, NULL, 'Low', 'Usually quiet unless the hallway is active.', NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:11:00'),
(28, 3, 4, 'Limited', 'Enough outlets for a small group, but not on every wall.', NULL, NULL, 'Limited', 'Enough outlets for a small group, but not on every wall.', NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:12:00'),
(29, 4, 4, '8', 'Comfortable for a smaller project group.', NULL, NULL, '8', 'Comfortable for a smaller project group.', NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:13:00'),
(30, 6, 4, 'Yes', 'Good for structured group work.', NULL, NULL, 'Yes', 'Good for structured group work.', NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:14:00'),
(31, 9, 4, 'Yes', 'This room generally depends on a reservation.', NULL, NULL, 'Yes', 'This room generally depends on a reservation.', NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:15:00'),
(32, 10, 4, 'Limited Info', 'Accessibility may vary depending on room assignment and entrance route.', NULL, NULL, 'Limited Info', 'Accessibility may vary depending on room assignment and entrance route.', NULL, 'approved', NULL, NULL, NULL, '2026-01-18 15:16:00'),

(33, 1, 5, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:45:00'),
(34, 2, 5, 'Medium', 'The bridge gets busy between classes.', NULL, NULL, 'Medium', 'The bridge gets busy between classes.', NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:46:00'),
(35, 3, 5, 'Many', 'There are usually enough outlets for short laptop sessions.', NULL, NULL, 'Many', 'There are usually enough outlets for short laptop sessions.', NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:47:00'),
(36, 4, 5, '120', 'A mix of smaller and shared table seating.', NULL, NULL, '120', 'A mix of smaller and shared table seating.', NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:48:00'),
(37, 5, 5, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:49:00'),
(38, 6, 5, 'Yes', 'Best for shorter sessions or between-class work.', NULL, NULL, 'Yes', 'Best for shorter sessions or between-class work.', NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:50:00'),
(39, 10, 5, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:51:00'),
(40, 11, 5, 'Quick work between classes', NULL, NULL, NULL, 'Quick work between classes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-01 10:52:00'),

(41, 2, 6, 'Medium', 'Noise varies a lot depending on events and weather.', NULL, NULL, 'Medium', 'Noise varies a lot depending on events and weather.', NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:00:00'),
(42, 4, 6, '500', 'Large open space with flexible informal seating nearby, not fixed desks.', NULL, NULL, '500', 'Large open space with flexible informal seating nearby, not fixed desks.', NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:01:00'),
(43, 5, 6, 'Outdoor', NULL, NULL, NULL, 'Outdoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:02:00'),
(44, 6, 6, 'Yes', 'Works best for reading, walking breaks, or low-pressure work.', NULL, NULL, 'Yes', 'Works best for reading, walking breaks, or low-pressure work.', NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:03:00'),
(45, 7, 6, 'None', 'No dedicated parking in the middle of campus.', NULL, NULL, 'None', 'No dedicated parking in the middle of campus.', NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:04:00'),
(46, 8, 6, 'No', NULL, NULL, NULL, 'No', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:05:00'),
(47, 10, 6, 'Partially Accessible', 'Open lawns and paths are accessible in many areas, but conditions vary with weather and event setups.', NULL, NULL, 'Partially Accessible', 'Open lawns and paths are accessible in many areas, but conditions vary with weather and event setups.', NULL, 'approved', NULL, NULL, NULL, '2026-02-05 14:06:00'),

(48, 1, 7, 'Yes', 'Campus Wi-Fi is available throughout Squires.', NULL, NULL, 'Yes', 'Campus Wi-Fi is available throughout Squires.', NULL, 'approved', NULL, NULL, NULL, '2026-04-11 11:15:00'),
(49, 2, 7, 'High', 'Gets loud during lunch and event traffic.', NULL, NULL, 'High', 'Gets loud during lunch and event traffic.', NULL, 'approved', NULL, NULL, NULL, '2026-04-11 11:16:00'),
(50, 3, 7, 'Limited', 'Outlets exist, but they are not consistently convenient.', NULL, NULL, 'Limited', 'Outlets exist, but they are not consistently convenient.', NULL, 'approved', NULL, NULL, NULL, '2026-04-11 11:17:00'),
(51, 8, 7, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-11 11:18:00'),
(52, 9, 7, 'No', 'No reservation is typically required for general dining seating.', NULL, NULL, 'No', 'No reservation is typically required for general dining seating.', NULL, 'approved', NULL, NULL, NULL, '2026-04-11 11:19:00'),
(53, NULL, 7, '11:30 AM - 1:30 PM', 'User-submitted peak busy window suggestion pending moderation.', 'Peak Busy Window', 'text', '11:30 AM - 1:30 PM', 'User-submitted peak busy window suggestion pending moderation.', NULL, 'pending', NULL, NULL, NULL, '2026-04-11 11:20:00'),

(54, 1, 8, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:00:00'),
(55, 2, 8, 'Low', 'Usually quieter than the busiest campus options.', NULL, NULL, 'Low', 'Usually quieter than the busiest campus options.', NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:01:00'),
(56, 3, 8, 'Many', 'Outlets are available along several wall and table areas.', NULL, NULL, 'Many', 'Outlets are available along several wall and table areas.', NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:02:00'),
(57, 4, 8, '90', 'Approximate seating for reading and quiet work.', NULL, NULL, '90', 'Approximate seating for reading and quiet work.', NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:03:00'),
(58, 5, 8, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:04:00'),
(59, 6, 8, 'Yes', 'Strong option when you want less campus traffic.', NULL, NULL, 'Yes', 'Strong option when you want less campus traffic.', NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:05:00'),
(60, 7, 8, 'Street', NULL, NULL, NULL, 'Street', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:06:00'),
(61, 10, 8, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:07:00'),
(62, 11, 8, 'Quiet reading and focused work', NULL, NULL, NULL, 'Quiet reading and focused work', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-24 10:08:00'),

(63, 1, 9, 'Yes', 'Guest network access is workable in the atrium.', NULL, NULL, 'Yes', 'Guest network access is workable in the atrium.', NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:50:00'),
(64, 2, 9, 'Low', 'Usually calm during most of the day.', NULL, NULL, 'Low', 'Usually calm during most of the day.', NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:51:00'),
(65, 3, 9, 'Many', 'Plenty of wall and lounge-area outlets.', NULL, NULL, 'Many', 'Plenty of wall and lounge-area outlets.', NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:52:00'),
(66, 4, 9, '60', 'Comfortable shared seating estimate.', NULL, NULL, '60', 'Comfortable shared seating estimate.', NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:53:00'),
(67, 5, 9, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:54:00'),
(68, 6, 9, 'Yes', 'Good for focused laptop work or a professional-feeling meeting.', NULL, NULL, 'Yes', 'Good for focused laptop work or a professional-feeling meeting.', NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:55:00'),
(69, 7, 9, 'Lot', NULL, NULL, NULL, 'Lot', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:56:00'),
(70, 10, 9, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-10 08:57:00'),
(71, NULL, 9, 'Yes', 'Claim about complimentary drinks was not verified by moderators.', 'Free Coffee', 'boolean', 'Yes', 'Claim about complimentary drinks was not verified by moderators.', NULL, 'rejected', 'Could not verify complimentary coffee availability for visitors.', '2026-04-20 09:10:00', 1, '2026-04-18 08:00:00'),

(72, 1, 10, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:30:00'),
(73, 2, 10, 'Medium', 'Noise level swings widely during events.', NULL, NULL, 'Medium', 'Noise level swings widely during events.', NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:31:00'),
(74, 3, 10, 'Limited', 'Outlets are available, but not evenly distributed.', NULL, NULL, 'Limited', 'Outlets are available, but not evenly distributed.', NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:32:00'),
(75, 4, 10, '70', 'Estimated lounge seating when the area is open.', NULL, NULL, '70', 'Estimated lounge seating when the area is open.', NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:33:00'),
(76, 5, 10, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:34:00'),
(77, 6, 10, 'Yes', 'Convenient, but not consistently calm enough for deep work.', NULL, NULL, 'Yes', 'Convenient, but not consistently calm enough for deep work.', NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:35:00'),
(78, 7, 10, 'Garage', 'Most nearby parking is campus garage or paid event parking.', NULL, NULL, 'Garage', 'Most nearby parking is campus garage or paid event parking.', NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:36:00'),
(79, 10, 10, 'Partially Accessible', NULL, NULL, NULL, 'Partially Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-01-28 16:37:00'),
(80, NULL, 10, 'Yes', 'User-submitted amenity claim was rejected during moderation.', 'Has nap pods', 'boolean', 'Yes', 'User-submitted amenity claim was rejected during moderation.', NULL, 'rejected', 'No evidence of nap pods in this lounge area.', '2026-03-29 13:05:00', 2, '2026-03-27 10:15:00'),

(81, 1, 11, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:35:00'),
(82, 2, 11, 'Medium', 'Quieter than campus cafes, but still active around breakfast and lunch.', NULL, NULL, 'Medium', 'Quieter than campus cafes, but still active around breakfast and lunch.', NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:36:00'),
(83, 3, 11, 'Many', NULL, NULL, NULL, 'Many', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:37:00'),
(84, 4, 11, '36', 'A mix of tables for solo work and pairs.', NULL, NULL, '36', 'A mix of tables for solo work and pairs.', NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:38:00'),
(85, 5, 11, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:39:00'),
(86, 6, 11, 'Yes', 'Better for casual work sessions than silent study.', NULL, NULL, 'Yes', 'Better for casual work sessions than silent study.', NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:40:00'),
(87, 7, 11, 'Lot', NULL, NULL, NULL, 'Lot', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:41:00'),
(88, 8, 11, 'Yes', NULL, NULL, NULL, 'Yes', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:42:00'),
(89, 10, 11, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:43:00'),
(90, 11, 11, 'Casual work sessions and coffee meetings', NULL, NULL, NULL, 'Casual work sessions and coffee meetings', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-02-14 09:44:00'),

(91, 2, 12, 'Low', 'Generally calm compared with downtown sidewalk seating.', NULL, NULL, 'Low', 'Generally calm compared with downtown sidewalk seating.', NULL, 'approved', NULL, NULL, NULL, '2026-04-17 08:05:00'),
(92, 5, 12, 'Outdoor', NULL, NULL, NULL, 'Outdoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-17 08:06:00'),
(93, 6, 12, 'Yes', 'Best for reading, walking breaks, and short outdoor stops.', NULL, NULL, 'Yes', 'Best for reading, walking breaks, and short outdoor stops.', NULL, 'approved', NULL, NULL, NULL, '2026-04-17 08:07:00'),
(94, 7, 12, 'Lot', 'Library parking is the most practical nearby option.', NULL, NULL, 'Lot', 'Library parking is the most practical nearby option.', NULL, 'approved', NULL, NULL, NULL, '2026-04-17 08:08:00'),
(95, 8, 12, 'No', NULL, NULL, NULL, 'No', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-17 08:09:00'),
(96, 10, 12, 'Partially Accessible', 'Trail and path conditions can vary with weather.', NULL, NULL, 'Partially Accessible', 'Trail and path conditions can vary with weather.', NULL, 'approved', NULL, NULL, NULL, '2026-04-17 08:10:00'),
(97, NULL, 12, 'Medium', 'Suggested by submitter to describe available tree cover near benches.', 'Shade Coverage', 'single_choice', 'Medium', 'Suggested by submitter to describe available tree cover near benches.', JSON_ARRAY('Low', 'Medium', 'High'), 'pending', NULL, NULL, NULL, '2026-04-17 08:11:00'),

(98, 1, 14, 'Yes', 'Campus Wi-Fi is usually available in the lobby.', NULL, NULL, 'Yes', 'Campus Wi-Fi is usually available in the lobby.', NULL, 'approved', NULL, NULL, NULL, '2026-04-07 10:15:00'),
(99, 2, 14, 'Medium', 'Noise varies based on performances and visitors.', NULL, NULL, 'Medium', 'Noise varies based on performances and visitors.', NULL, 'approved', NULL, NULL, NULL, '2026-04-07 10:16:00'),
(100, 3, 14, 'Limited', 'A few outlets are available near the lobby seating.', NULL, NULL, 'Limited', 'A few outlets are available near the lobby seating.', NULL, 'approved', NULL, NULL, NULL, '2026-04-07 10:17:00'),
(101, 5, 14, 'Indoor', NULL, NULL, NULL, 'Indoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-07 10:18:00'),
(102, 6, 14, 'Yes', 'Works better for short sessions than deep-focus study.', NULL, NULL, 'Yes', 'Works better for short sessions than deep-focus study.', NULL, 'approved', NULL, NULL, NULL, '2026-04-07 10:19:00'),
(103, 10, 14, 'Fully Accessible', NULL, NULL, NULL, 'Fully Accessible', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-07 10:20:00'),

(104, 1, 16, 'No', 'No public Wi-Fi is known at the picnic tables.', NULL, NULL, 'No', 'No public Wi-Fi is known at the picnic tables.', NULL, 'approved', NULL, NULL, NULL, '2026-04-08 09:20:00'),
(105, 5, 16, 'Outdoor', NULL, NULL, NULL, 'Outdoor', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-08 09:21:00'),
(106, 6, 16, 'No', 'Not a realistic study spot for most students.', NULL, NULL, 'No', 'Not a realistic study spot for most students.', NULL, 'approved', NULL, NULL, NULL, '2026-04-08 09:22:00'),
(107, 7, 16, 'Street', NULL, NULL, NULL, 'Street', NULL, NULL, 'approved', NULL, NULL, NULL, '2026-04-08 09:23:00');

-- ======================
-- SPOT HOURS
-- ======================
INSERT INTO spot_hours (
    hours_id,
    spot_id,
    days_of_week,
    open_time,
    close_time,
    notes
) VALUES
(1, 1, 'Monday', '07:00:00', '18:00:00', 'Kitchen closes shortly before posted close.'),
(2, 1, 'Tuesday', '07:00:00', '18:00:00', 'Kitchen closes shortly before posted close.'),
(3, 1, 'Wednesday', '07:00:00', '18:00:00', 'Kitchen closes shortly before posted close.'),
(4, 1, 'Thursday', '07:00:00', '18:00:00', 'Kitchen closes shortly before posted close.'),
(5, 1, 'Friday', '07:00:00', '18:00:00', 'Kitchen closes shortly before posted close.'),
(6, 1, 'Saturday', '08:00:00', '18:00:00', NULL),
(7, 1, 'Sunday', '08:00:00', '17:00:00', NULL),

(8, 2, 'Monday', '07:00:00', '23:00:00', 'Hours can extend during finals.'),
(9, 2, 'Tuesday', '07:00:00', '23:00:00', 'Hours can extend during finals.'),
(10, 2, 'Wednesday', '07:00:00', '23:00:00', 'Hours can extend during finals.'),
(11, 2, 'Thursday', '07:00:00', '23:00:00', 'Hours can extend during finals.'),
(12, 2, 'Friday', '07:00:00', '20:00:00', NULL),
(13, 2, 'Saturday', '10:00:00', '20:00:00', NULL),
(14, 2, 'Sunday', '10:00:00', '23:00:00', NULL),

(15, 3, 'Monday', '07:00:00', '23:00:00', 'Quiet-study expectations are strongest during weekday afternoons and evenings.'),
(16, 3, 'Tuesday', '07:00:00', '23:00:00', 'Quiet-study expectations are strongest during weekday afternoons and evenings.'),
(17, 3, 'Wednesday', '07:00:00', '23:00:00', 'Quiet-study expectations are strongest during weekday afternoons and evenings.'),
(18, 3, 'Thursday', '07:00:00', '23:00:00', 'Quiet-study expectations are strongest during weekday afternoons and evenings.'),
(19, 3, 'Friday', '07:00:00', '20:00:00', NULL),
(20, 3, 'Saturday', '10:00:00', '20:00:00', NULL),
(21, 3, 'Sunday', '10:00:00', '23:00:00', NULL),

(22, 4, 'Monday', '08:00:00', '22:00:00', 'Access depends on room reservation availability.'),
(23, 4, 'Tuesday', '08:00:00', '22:00:00', 'Access depends on room reservation availability.'),
(24, 4, 'Wednesday', '08:00:00', '22:00:00', 'Access depends on room reservation availability.'),
(25, 4, 'Thursday', '08:00:00', '22:00:00', 'Access depends on room reservation availability.'),
(26, 4, 'Friday', '08:00:00', '20:00:00', 'Access depends on room reservation availability.'),

(27, 5, 'Monday', '07:00:00', '23:00:00', 'Some areas remain accessible later with building access.'),
(28, 5, 'Tuesday', '07:00:00', '23:00:00', 'Some areas remain accessible later with building access.'),
(29, 5, 'Wednesday', '07:00:00', '23:00:00', 'Some areas remain accessible later with building access.'),
(30, 5, 'Thursday', '07:00:00', '23:00:00', 'Some areas remain accessible later with building access.'),
(31, 5, 'Friday', '07:00:00', '20:00:00', NULL),
(32, 5, 'Saturday', '10:00:00', '18:00:00', NULL),
(33, 5, 'Sunday', '10:00:00', '20:00:00', NULL),

(34, 6, 'Monday', '06:00:00', '22:00:00', 'Outdoor conditions and events can affect comfort.'),
(35, 6, 'Tuesday', '06:00:00', '22:00:00', 'Outdoor conditions and events can affect comfort.'),
(36, 6, 'Wednesday', '06:00:00', '22:00:00', 'Outdoor conditions and events can affect comfort.'),
(37, 6, 'Thursday', '06:00:00', '22:00:00', 'Outdoor conditions and events can affect comfort.'),
(38, 6, 'Friday', '06:00:00', '22:00:00', 'Outdoor conditions and events can affect comfort.'),
(39, 6, 'Saturday', '06:00:00', '22:00:00', NULL),
(40, 6, 'Sunday', '06:00:00', '22:00:00', NULL),

(41, 7, 'Monday', '11:00:00', '14:00:00', 'Lunch service window.'),
(42, 7, 'Monday', '17:00:00', '21:00:00', 'Dinner service window.'),
(43, 7, 'Tuesday', '11:00:00', '14:00:00', 'Lunch service window.'),
(44, 7, 'Tuesday', '17:00:00', '21:00:00', 'Dinner service window.'),
(45, 7, 'Wednesday', '11:00:00', '14:00:00', 'Lunch service window.'),
(46, 7, 'Wednesday', '17:00:00', '21:00:00', 'Dinner service window.'),
(47, 7, 'Thursday', '11:00:00', '14:00:00', 'Lunch service window.'),
(48, 7, 'Thursday', '17:00:00', '21:00:00', 'Dinner service window.'),
(49, 7, 'Friday', '11:00:00', '14:00:00', 'Lunch service window.'),
(50, 7, 'Friday', '17:00:00', '21:00:00', 'Dinner service window.'),
(51, 7, 'Saturday', '11:00:00', '15:00:00', 'Limited weekend hours.'),
(52, 7, 'Sunday', '11:00:00', '15:00:00', 'Limited weekend hours.'),

(53, 8, 'Monday', '10:00:00', '20:00:00', NULL),
(54, 8, 'Tuesday', '10:00:00', '20:00:00', NULL),
(55, 8, 'Wednesday', '10:00:00', '20:00:00', NULL),
(56, 8, 'Thursday', '10:00:00', '20:00:00', NULL),
(57, 8, 'Friday', '10:00:00', '18:00:00', NULL),
(58, 8, 'Saturday', '10:00:00', '17:00:00', NULL),
(59, 8, 'Sunday', '13:00:00', '17:00:00', NULL),

(60, 9, 'Monday', '08:00:00', '17:00:00', 'Access can be more limited outside standard business hours.'),
(61, 9, 'Tuesday', '08:00:00', '17:00:00', 'Access can be more limited outside standard business hours.'),
(62, 9, 'Wednesday', '08:00:00', '17:00:00', 'Access can be more limited outside standard business hours.'),
(63, 9, 'Thursday', '08:00:00', '17:00:00', 'Access can be more limited outside standard business hours.'),
(64, 9, 'Friday', '08:00:00', '17:00:00', 'Access can be more limited outside standard business hours.'),

(65, 10, 'Monday', '08:00:00', '22:00:00', 'Operating consistency varies with student-center programming.'),
(66, 10, 'Tuesday', '08:00:00', '22:00:00', 'Operating consistency varies with student-center programming.'),
(67, 10, 'Wednesday', '08:00:00', '22:00:00', 'Operating consistency varies with student-center programming.'),
(68, 10, 'Thursday', '08:00:00', '22:00:00', 'Operating consistency varies with student-center programming.'),
(69, 10, 'Friday', '08:00:00', '20:00:00', 'Operating consistency varies with student-center programming.'),
(70, 10, 'Saturday', '10:00:00', '18:00:00', NULL),
(71, 10, 'Sunday', '10:00:00', '18:00:00', NULL),

(72, 11, 'Monday', '07:30:00', '17:00:00', NULL),
(73, 11, 'Tuesday', '07:30:00', '17:00:00', NULL),
(74, 11, 'Wednesday', '07:30:00', '17:00:00', NULL),
(75, 11, 'Thursday', '07:30:00', '17:00:00', NULL),
(76, 11, 'Friday', '07:30:00', '17:00:00', NULL),
(77, 11, 'Saturday', '08:30:00', '15:00:00', NULL),

(78, 12, 'Monday', '06:00:00', '21:00:00', 'Trail and weather conditions vary seasonally.'),
(79, 12, 'Tuesday', '06:00:00', '21:00:00', 'Trail and weather conditions vary seasonally.'),
(80, 12, 'Wednesday', '06:00:00', '21:00:00', 'Trail and weather conditions vary seasonally.'),
(81, 12, 'Thursday', '06:00:00', '21:00:00', 'Trail and weather conditions vary seasonally.'),
(82, 12, 'Friday', '06:00:00', '21:00:00', 'Trail and weather conditions vary seasonally.'),
(83, 12, 'Saturday', '06:00:00', '21:00:00', NULL),
(84, 12, 'Sunday', '06:00:00', '21:00:00', NULL),

(85, 13, 'Monday', '08:00:00', '22:00:00', 'Hours are based on typical building access for students.'),
(86, 13, 'Tuesday', '08:00:00', '22:00:00', 'Hours are based on typical building access for students.'),
(87, 13, 'Wednesday', '08:00:00', '22:00:00', 'Hours are based on typical building access for students.'),
(88, 13, 'Thursday', '08:00:00', '22:00:00', 'Hours are based on typical building access for students.'),
(89, 13, 'Friday', '08:00:00', '18:00:00', NULL),

(90, 15, 'Monday', '11:00:00', '21:00:00', 'Hours reflect the former dining schedule when the listing was active.'),
(91, 15, 'Tuesday', '11:00:00', '21:00:00', 'Hours reflect the former dining schedule when the listing was active.'),
(92, 15, 'Wednesday', '11:00:00', '21:00:00', 'Hours reflect the former dining schedule when the listing was active.'),
(93, 15, 'Thursday', '11:00:00', '21:00:00', 'Hours reflect the former dining schedule when the listing was active.'),
(94, 15, 'Friday', '11:00:00', '20:00:00', 'Hours reflect the former dining schedule when the listing was active.');

-- ======================
-- SPOT MEDIA
-- ======================
-- Intentionally left empty per request.

-- ======================
-- CONTENT REPORTS
-- ======================
INSERT INTO content_report (
    report_id,
    user_id,
    review_id,
    spot_id,
    reason,
    details,
    status,
    created_at,
    resolved_at,
    resolution_note
) VALUES
(1, 4, NULL, 8, 'Closed / no longer valid', 'I checked late in the evening and the branch looked closed, so the listed expectations may need a closer review.', 'resolved', '2025-11-18 16:20:00', '2025-11-20 10:00:00', 'Library remains active; no closure issue was confirmed.'),
(2, 1, NULL, 8, 'Closed / no longer valid', 'Wanted to make sure the winter hours were still current for this branch.', 'resolved', '2026-01-14 13:15:00', '2026-01-15 09:40:00', 'Hours were reviewed and the listing was kept active.'),
(3, 1, 12, NULL, 'Personal information exposed', 'I thought the review might be too specific about another visitor, but it does not appear to include identifying details after review.', 'dismissed', '2026-02-20 18:05:00', '2026-02-21 09:25:00', 'Report dismissed after moderation review.'),
(4, 2, 11, NULL, 'Fake or misleading review', 'The review reads more like a rant than an actual description of the spot and does not match the current state of the lounge.', 'resolved', '2026-03-27 08:15:00', '2026-03-28 09:30:00', 'Review removed by admin moderation.'),
(5, 4, 11, NULL, 'Irrelevant content', 'The comment is not useful for other users and does not explain the space in a constructive way.', 'resolved', '2026-03-27 08:40:00', '2026-03-28 09:31:00', 'Review removed by admin moderation.'),
(6, 4, NULL, 10, 'Closed / no longer valid', 'The lounge was unavailable during multiple visits and may no longer be dependable enough to stay active.', 'resolved', '2026-03-28 17:10:00', '2026-03-29 13:10:00', 'Spot was verified and marked inactive.'),
(7, 1, 6, NULL, 'Offensive or abusive language', 'The review is blunt, but I was unsure whether it crossed the line for moderation.', 'dismissed', '2026-04-07 14:25:00', '2026-04-08 10:05:00', 'Report dismissed after review; no policy violation was found.'),
(8, 2, NULL, 5, 'Misleading information', 'This listing makes the bridge sound quieter than it really is during peak class transitions.', 'open', '2026-04-09 12:45:00', NULL, NULL),
(9, 3, NULL, 7, 'Duplicate listing', 'This may overlap with other Squires food spots, so it might need admin review before approval.', 'dismissed', '2026-04-12 15:20:00', '2026-04-13 09:15:00', 'Pending listing is distinct enough to remain under review.'),
(10, 2, 3, NULL, 'Spam', 'The praise feels a little exaggerated and repetitive, so I flagged it for a quick moderator check.', 'open', '2026-04-16 11:35:00', NULL, NULL),
(11, 3, 3, NULL, 'Fake or misleading review', 'I think the review may overstate how easy it is to find seating during finals week.', 'open', '2026-04-17 09:10:00', NULL, NULL),
(12, 2, NULL, 12, 'Incorrect location', 'The map pin looks a little off compared with the nearby library access point and trail entrance.', 'open', '2026-04-21 08:55:00', NULL, NULL),
(13, 3, NULL, 6, 'Unsafe or restricted place', 'Large events can make this area hard to use, so I wanted moderators to consider whether that should be called out more clearly.', 'open', '2026-04-22 18:40:00', NULL, NULL),
(14, 1, NULL, 9, 'Unsafe or restricted place', 'The atrium can become access-limited after business hours, which could confuse visitors expecting open public access.', 'open', '2026-04-18 17:30:00', NULL, NULL),
(15, 4, NULL, 9, 'Misleading information', 'The description should probably be more explicit that this is not a traditional public study lounge.', 'dismissed', '2026-04-19 09:45:00', '2026-04-20 09:20:00', 'Description was reviewed; no additional moderation action was needed.');

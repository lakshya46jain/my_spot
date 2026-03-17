USE myspot;

-- ======================
-- ROLES
-- ======================
INSERT INTO roles (role_name) VALUES
('admin'),
('user'),
('moderator'),
('owner'),
('guest');

-- ======================
-- ATTRIBUTE MENU
-- ======================
INSERT INTO attribute_menu (name) VALUES
('WiFi'),
('Parking'),
('Outdoor Seating'),
('Pet Friendly'),
('Restrooms');

-- ======================
-- USERS
-- ======================
INSERT INTO users (display_name, email, password_hash, role_id) VALUES
('Alice Johnson', 'alice@example.com', 'hash1', 1),
('Bob Smith', 'bob@example.com', 'hash2', 2),
('Charlie Brown', 'charlie@example.com', 'hash3', 3),
('Diana Prince', 'diana@example.com', 'hash4', 2),
('Ethan Hunt', 'ethan@example.com', 'hash5', 4);

-- ======================
-- SPOTS
-- ======================
INSERT INTO spots (parent_spot_id, spot_type, spot_name, short_description, address, latitude, longitude, user_id, status) VALUES
(NULL, 'Cafe', 'Central Perk', 'Cozy coffee shop', '123 Main St', 37.7749, -122.4194, 1, 'active'),
(NULL, 'Restaurant', 'Burger Hub', 'Best burgers in town', '456 Oak St', 37.7750, -122.4180, 2, 'active'),
(NULL, 'Park', 'Green Park', 'Nice outdoor space', '789 Pine St', 37.7760, -122.4170, 3, 'active'),
(NULL, 'Gym', 'FitZone', 'Modern fitness center', '321 Elm St', 37.7770, -122.4160, 4, 'active'),
(NULL, 'Library', 'City Library', 'Quiet reading space', '654 Maple St', 37.7780, -122.4150, 5, 'active');

-- ======================
-- REVIEWS
-- ======================
INSERT INTO reviews (spot_id, user_id, rating, review) VALUES
(1, 2, 5, 'Amazing place!'),
(2, 1, 4, 'Great burgers'),
(3, 4, 5, 'Very relaxing'),
(4, 3, 3, 'Decent gym'),
(5, 2, 4, 'Nice and quiet');

-- ======================
-- FAVORITES
-- ======================
INSERT INTO favorites (user_id, spot_id) VALUES
(1, 2),
(2, 1),
(3, 3),
(4, 4),
(5, 5);

-- ======================
-- SPOT ATTRIBUTES
-- ======================
INSERT INTO spot_attributes (attribute_id, spot_id, value, notes) VALUES
(1, 1, 'Yes', 'Free WiFi'),
(2, 2, 'Yes', 'Street parking'),
(3, 3, 'Yes', 'Outdoor benches'),
(4, 4, 'No', 'No pets allowed'),
(5, 5, 'Yes', 'Clean restrooms');

-- ======================
-- SPOT HOURS
-- ======================
INSERT INTO spot_hours (spot_id, days_of_week, open_time, close_time, notes) VALUES
(1, 'Mon-Fri', '08:00:00', '20:00:00', NULL),
(2, 'Daily', '10:00:00', '22:00:00', NULL),
(3, 'Daily', '06:00:00', '21:00:00', NULL),
(4, 'Mon-Sat', '07:00:00', '23:00:00', NULL),
(5, 'Mon-Fri', '09:00:00', '18:00:00', NULL);

-- ======================
-- SPOT MEDIA
-- ======================
INSERT INTO spot_media (spot_id, user_id, media_url) VALUES
(1, 1, 'http://example.com/media1.jpg'),
(2, 2, 'http://example.com/media2.jpg'),
(3, 3, 'http://example.com/media3.jpg'),
(4, 4, 'http://example.com/media4.jpg'),
(5, 5, 'http://example.com/media5.jpg');

-- ======================
-- CONTENT REPORT
-- ======================
INSERT INTO content_report (user_id, review_id, spot_id, reason, details, status) VALUES
(1, 1, NULL, 'Spam', 'Looks fake', 'open'),
(2, 2, NULL, 'Offensive', 'Inappropriate language', 'open'),
(3, NULL, 3, 'Incorrect Info', 'Wrong hours listed', 'open'),
(4, 3, NULL, 'Spam', 'Duplicate review', 'resolved'),
(5, NULL, 2, 'Other', 'Needs review', 'open');
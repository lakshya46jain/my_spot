CREATE SCHEMA IF NOT EXISTS myspot;
USE myspot;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS content_report;
DROP TABLE IF EXISTS spot_media;
DROP TABLE IF EXISTS spot_hours;
DROP TABLE IF EXISTS spot_attributes;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS spots;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS attribute_menu;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
    role_id INT NOT NULL AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_roles_role_name (role_name)
);

CREATE TABLE attribute_menu (
    attribute_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (attribute_id)
);

CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    deleted_at DATETIME DEFAULT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    KEY fk_users_role (role_id),
    KEY idx_users_is_active (is_active),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

CREATE TABLE spots (
    spot_id INT NOT NULL AUTO_INCREMENT,
    parent_spot_id INT DEFAULT NULL,
    spot_type VARCHAR(50) NOT NULL,
    spot_name VARCHAR(150) NOT NULL,
    short_description TEXT,
    address VARCHAR(255) DEFAULT NULL,
    latitude DECIMAL(9,6) DEFAULT NULL,
    longitude DECIMAL(9,6) DEFAULT NULL,
    user_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT NULL,
    status VARCHAR(50) NOT NULL,
    PRIMARY KEY (spot_id),
    KEY fk_spots_parent (parent_spot_id),
    KEY fk_spots_user (user_id),
    CONSTRAINT fk_spots_parent
        FOREIGN KEY (parent_spot_id) REFERENCES spots (spot_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_spots_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE reviews (
    review_id INT NOT NULL AUTO_INCREMENT,
    spot_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    review TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    KEY fk_reviews_spot (spot_id),
    KEY fk_reviews_user (user_id),
    CONSTRAINT fk_reviews_spot
        FOREIGN KEY (spot_id) REFERENCES spots (spot_id),
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT chk_reviews_rating
        CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE favorites (
    user_id INT NOT NULL,
    spot_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, spot_id),
    KEY fk_favorites_spot (spot_id),
    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_favorites_spot
        FOREIGN KEY (spot_id) REFERENCES spots (spot_id)
);

CREATE TABLE spot_attributes (
    spot_attribute_id INT NOT NULL AUTO_INCREMENT,
    attribute_id INT NOT NULL,
    spot_id INT NOT NULL,
    value VARCHAR(100) DEFAULT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (spot_attribute_id),
    KEY fk_spot_attributes_attribute (attribute_id),
    KEY fk_spot_attributes_spot (spot_id),
    CONSTRAINT fk_spot_attributes_attribute
        FOREIGN KEY (attribute_id) REFERENCES attribute_menu (attribute_id),
    CONSTRAINT fk_spot_attributes_spot
        FOREIGN KEY (spot_id) REFERENCES spots (spot_id)
);

CREATE TABLE spot_hours (
    hours_id INT NOT NULL AUTO_INCREMENT,
    spot_id INT NOT NULL,
    days_of_week VARCHAR(50) NOT NULL,
    open_time TIME DEFAULT NULL,
    close_time TIME DEFAULT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (hours_id),
    KEY fk_spot_hours_spot (spot_id),
    CONSTRAINT fk_spot_hours_spot
        FOREIGN KEY (spot_id) REFERENCES spots (spot_id)
);

CREATE TABLE spot_media (
    media_id INT NOT NULL AUTO_INCREMENT,
    spot_id INT NOT NULL,
    user_id INT NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (media_id),
    KEY fk_spot_media_spot (spot_id),
    KEY fk_spot_media_user (user_id),
    CONSTRAINT fk_spot_media_spot
        FOREIGN KEY (spot_id) REFERENCES spots (spot_id),
    CONSTRAINT fk_spot_media_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE content_report (
    report_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    review_id INT DEFAULT NULL,
    spot_id INT DEFAULT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL,
    resolution_note TEXT,
    PRIMARY KEY (report_id),
    KEY fk_content_report_user (user_id),
    KEY fk_content_report_review (review_id),
    KEY fk_content_report_spot (spot_id),
    CONSTRAINT fk_content_report_user
        FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_content_report_review
        FOREIGN KEY (review_id) REFERENCES reviews (review_id),
    CONSTRAINT fk_content_report_spot
        FOREIGN KEY (spot_id) REFERENCES spots (spot_id)
);
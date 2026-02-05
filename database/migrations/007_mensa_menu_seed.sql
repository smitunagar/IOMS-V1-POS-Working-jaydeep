-- Mensa menu schema + seed data

-- =========================
-- 1) Core reference tables
-- =========================

CREATE TABLE IF NOT EXISTS mensa (
  mensa_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT
);

CREATE TABLE IF NOT EXISTS dietary_tag (
  tag_id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS allergen (
  allergen_id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS additive (
  additive_id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredient (
  ingredient_id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- ==================================
-- 2) Menu item + composition tables
-- ==================================

CREATE TABLE IF NOT EXISTS menu_item (
  item_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_recipe_complete BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS portion (
  portion_id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL,
  portion_label TEXT NOT NULL,
  serving_size_g INTEGER,
  serving_size_ml INTEGER,
  pricing_unit TEXT,
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id)
);

CREATE TABLE IF NOT EXISTS menu_item_ingredient (
  item_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  role TEXT,
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id),
  PRIMARY KEY (item_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS menu_item_tag (
  item_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id),
  FOREIGN KEY (tag_id) REFERENCES dietary_tag(tag_id),
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS menu_item_allergen (
  item_id INTEGER NOT NULL,
  allergen_id INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id),
  FOREIGN KEY (allergen_id) REFERENCES allergen(allergen_id),
  PRIMARY KEY (item_id, allergen_id)
);

CREATE TABLE IF NOT EXISTS menu_item_additive (
  item_id INTEGER NOT NULL,
  additive_id INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id),
  FOREIGN KEY (additive_id) REFERENCES additive(additive_id),
  PRIMARY KEY (item_id, additive_id)
);

-- =========================
-- 3) Day-by-day offering
-- =========================

CREATE TABLE IF NOT EXISTS daily_offer (
  offer_id INTEGER PRIMARY KEY,
  mensa_id INTEGER NOT NULL,
  offer_date DATE NOT NULL,
  item_id INTEGER NOT NULL,
  line_name TEXT,
  price_student_eur REAL,
  price_staff_eur REAL,
  price_guest_eur REAL,
  FOREIGN KEY (mensa_id) REFERENCES mensa(mensa_id),
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id)
);

-- =========================
-- Seed data (minimal)
-- =========================

INSERT INTO mensa (mensa_id, name, address, city, country)
VALUES (1, 'Mensa Wilhelmstraße', 'Wilhelmstraße 13', 'Tübingen', 'DE')
ON CONFLICT (mensa_id) DO NOTHING;

INSERT INTO dietary_tag (tag_id, code, label) VALUES
(1, 'VEGAN', 'Vegan'),
(2, 'VEGETARIAN', 'Vegetarian'),
(3, 'MENSAVITAL', 'MensaVital')
ON CONFLICT (tag_id) DO NOTHING;

INSERT INTO allergen (allergen_id, code, label) VALUES
(1, 'GLUTEN', 'Gluten'),
(2, 'WHEAT', 'Wheat'),
(3, 'MILK', 'Milk'),
(4, 'MUSTARD', 'Mustard'),
(5, 'CELERY', 'Celery'),
(6, 'BARLEY', 'Barley')
ON CONFLICT (allergen_id) DO NOTHING;

INSERT INTO additive (additive_id, code, label) VALUES
(1, 'ANTIOXIDANT', 'Antioxidant'),
(2, 'COLORANT', 'Colorant'),
(3, 'SULPHITED', 'Sulphited'),
(4, 'CURING_SALT', 'Curing salt (nitrite)')
ON CONFLICT (additive_id) DO NOTHING;

INSERT INTO ingredient (ingredient_id, name) VALUES
(1, 'Penne pasta'),
(2, 'Tomato sauce'),
(3, 'Chili'),
(4, 'Garlic'),
(5, 'Mixed leaf salad'),
(6, 'Meat loaf (Fleischkäse)'),
(7, 'Gravy'),
(8, 'Green beans'),
(9, 'Corn'),
(10, 'Mashed potatoes'),
(11, 'Samosa'),
(12, 'Mie noodles'),
(13, 'Tomato dip'),
(14, 'Chicken cordon bleu'),
(15, 'Cream sauce'),
(16, 'Country potatoes'),
(17, 'Baked vegetables'),
(18, 'Sauce Hollandaise'),
(19, 'Potato rösti')
ON CONFLICT (ingredient_id) DO NOTHING;

INSERT INTO menu_item (item_id, name, category, is_recipe_complete, notes) VALUES
(100, 'Penne Arrabiata + leaf salad', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(101, 'Fleischkäse + gravy + green beans & corn + mashed potatoes', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(102, 'Samosas + mie noodles + tomato dip', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(103, 'Chicken cordon bleu + cream sauce + country potatoes + leaf salad', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(104, 'Baked vegetables + Hollandaise + potato rösti', 'AUSWAHLGERICHT', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.')
ON CONFLICT (item_id) DO NOTHING;

INSERT INTO portion (portion_id, item_id, portion_label, serving_size_g, serving_size_ml, pricing_unit) VALUES
(1, 100, 'Standard plate', 450, NULL, 'per_portion'),
(2, 101, 'Standard plate', 520, NULL, 'per_portion'),
(3, 102, 'Standard plate', 480, NULL, 'per_portion'),
(4, 103, 'Standard plate', 520, NULL, 'per_portion'),
(5, 104, 'Standard plate', 500, NULL, 'per_portion')
ON CONFLICT (portion_id) DO NOTHING;

INSERT INTO menu_item_ingredient (item_id, ingredient_id, role) VALUES
(100, 1, 'main'), (100, 2, 'sauce'), (100, 3, 'seasoning'), (100, 4, 'seasoning'), (100, 5, 'side'),
(101, 6, 'main'), (101, 7, 'sauce'), (101, 8, 'side'), (101, 9, 'side'), (101, 10, 'side'),
(102, 11, 'main'), (102, 12, 'side'), (102, 13, 'dip'),
(103, 14, 'main'), (103, 15, 'sauce'), (103, 16, 'side'), (103, 5, 'side'),
(104, 17, 'main'), (104, 18, 'sauce'), (104, 19, 'side')
ON CONFLICT (item_id, ingredient_id) DO NOTHING;

INSERT INTO menu_item_tag (item_id, tag_id) VALUES
(100, 1),
(102, 1),
(104, 2)
ON CONFLICT (item_id, tag_id) DO NOTHING;

INSERT INTO menu_item_allergen (item_id, allergen_id) VALUES
(100, 1), (100, 2), (100, 4), (100, 5),
(101, 3),
(102, 1), (102, 2), (102, 6),
(103, 1), (103, 2), (103, 3),
(104, 3)
ON CONFLICT (item_id, allergen_id) DO NOTHING;

INSERT INTO menu_item_additive (item_id, additive_id) VALUES
(100, 1), (100, 2), (100, 3),
(101, 4)
ON CONFLICT (item_id, additive_id) DO NOTHING;

INSERT INTO daily_offer (offer_id, mensa_id, offer_date, item_id, line_name, price_student_eur, price_staff_eur, price_guest_eur) VALUES
(1, 1, '2026-02-02', 100, 'Tagesmenü Vegan', 3.70, 5.20, 7.00),
(2, 1, '2026-02-02', 101, 'Tagesmenü Standard', 4.20, 5.80, 7.50),
(3, 1, '2026-02-03', 102, 'Tagesmenü Vegan', 3.70, 5.20, 7.00),
(4, 1, '2026-02-03', 103, 'Tagesmenü Standard', 4.50, 6.10, 7.80),
(5, 1, '2026-02-03', 104, 'Auswahlgericht', 4.10, 5.70, 7.40)
ON CONFLICT (offer_id) DO NOTHING;

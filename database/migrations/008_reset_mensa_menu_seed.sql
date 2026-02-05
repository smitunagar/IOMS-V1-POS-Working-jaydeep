-- Reset mensa menu data and seed only the specified records

-- Truncate in dependency order
TRUNCATE TABLE
  daily_offer,
  menu_item_additive,
  menu_item_allergen,
  menu_item_tag,
  menu_item_ingredient,
  portion,
  menu_item,
  ingredient,
  additive,
  allergen,
  dietary_tag,
  mensa
RESTART IDENTITY CASCADE;

-- =========================
-- Seed data (minimal)
-- =========================

INSERT INTO mensa (mensa_id, name, address, city, country)
VALUES (1, 'Mensa Wilhelmstraße', 'Wilhelmstraße 13', 'Tübingen', 'DE');

-- Tags
INSERT INTO dietary_tag (tag_id, code, label) VALUES
(1, 'VEGAN', 'Vegan'),
(2, 'VEGETARIAN', 'Vegetarian'),
(3, 'MENSAVITAL', 'MensaVital');

-- Allergens (subset based on what’s commonly flagged on these menus)
INSERT INTO allergen (allergen_id, code, label) VALUES
(1, 'GLUTEN', 'Gluten'),
(2, 'WHEAT', 'Wheat'),
(3, 'MILK', 'Milk'),
(4, 'MUSTARD', 'Mustard'),
(5, 'CELERY', 'Celery'),
(6, 'BARLEY', 'Barley');

-- Additives (subset)
INSERT INTO additive (additive_id, code, label) VALUES
(1, 'ANTIOXIDANT', 'Antioxidant'),
(2, 'COLORANT', 'Colorant'),
(3, 'SULPHITED', 'Sulphited'),
(4, 'CURING_SALT', 'Curing salt (nitrite)');

-- Ingredients (mock, but plausible)
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
(19, 'Potato rösti');

-- Menu items (examples you referenced / typical from public mirrors)
INSERT INTO menu_item (item_id, name, category, is_recipe_complete, notes) VALUES
(100, 'Penne Arrabiata + leaf salad', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(101, 'Fleischkäse + gravy + green beans & corn + mashed potatoes', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(102, 'Samosas + mie noodles + tomato dip', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(103, 'Chicken cordon bleu + cream sauce + country potatoes + leaf salad', 'TAGESMENUE', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.'),
(104, 'Baked vegetables + Hollandaise + potato rösti', 'AUSWAHLGERICHT', FALSE, 'Ingredients/portion are mocked; allergens/additives are representative.');

-- Portion defaults (MOCK)
INSERT INTO portion (portion_id, item_id, portion_label, serving_size_g, serving_size_ml, pricing_unit) VALUES
(1, 100, 'Standard plate', 450, NULL, 'per_portion'),
(2, 101, 'Standard plate', 520, NULL, 'per_portion'),
(3, 102, 'Standard plate', 480, NULL, 'per_portion'),
(4, 103, 'Standard plate', 520, NULL, 'per_portion'),
(5, 104, 'Standard plate', 500, NULL, 'per_portion');

-- Compose ingredients for each item (MOCK but structured)
INSERT INTO menu_item_ingredient (item_id, ingredient_id, role) VALUES
(100, 1, 'main'), (100, 2, 'sauce'), (100, 3, 'seasoning'), (100, 4, 'seasoning'), (100, 5, 'side'),
(101, 6, 'main'), (101, 7, 'sauce'), (101, 8, 'side'), (101, 9, 'side'), (101, 10, 'side'),
(102, 11, 'main'), (102, 12, 'side'), (102, 13, 'dip'),
(103, 14, 'main'), (103, 15, 'sauce'), (103, 16, 'side'), (103, 5, 'side'),
(104, 17, 'main'), (104, 18, 'sauce'), (104, 19, 'side');

-- Tags (where known/assumed from menu labels)
INSERT INTO menu_item_tag (item_id, tag_id) VALUES
(100, 1),
(102, 1),
(104, 2);

-- Allergens (representative; adjust as you learn exact flags)
INSERT INTO menu_item_allergen (item_id, allergen_id) VALUES
(100, 1), (100, 2), (100, 4), (100, 5),
(101, 3),
(102, 1), (102, 2), (102, 6),
(103, 1), (103, 2), (103, 3),
(104, 3);

-- Additives (representative)
INSERT INTO menu_item_additive (item_id, additive_id) VALUES
(100, 1), (100, 2), (100, 3),
(101, 4);

-- Daily offers (example dates; replace with real dates if you scrape/obtain week plan)
INSERT INTO daily_offer (offer_id, mensa_id, offer_date, item_id, line_name, price_student_eur, price_staff_eur, price_guest_eur) VALUES
(1, 1, '2026-02-02', 100, 'Tagesmenü Vegan', 3.70, 5.20, 7.00),
(2, 1, '2026-02-02', 101, 'Tagesmenü Standard', 4.20, 5.80, 7.50),
(3, 1, '2026-02-03', 102, 'Tagesmenü Vegan', 3.70, 5.20, 7.00),
(4, 1, '2026-02-03', 103, 'Tagesmenü Standard', 4.50, 6.10, 7.80),
(5, 1, '2026-02-03', 104, 'Auswahlgericht', 4.10, 5.70, 7.40);

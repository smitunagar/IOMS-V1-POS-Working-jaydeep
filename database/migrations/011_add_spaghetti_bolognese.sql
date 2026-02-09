-- Add Spaghetti Bolognese to menu with full ingredients
-- Ingredients: spaghetti pasta, ground beef, tomato sauce, onion, garlic,
--              carrot, celery, olive oil, oregano, parmesan cheese

-- Add new ingredients (ON CONFLICT to avoid duplicates if re-run)
INSERT INTO ingredient (ingredient_id, name) VALUES
(20, 'Spaghetti pasta'),
(21, 'Ground beef'),
(22, 'Onion'),
(23, 'Carrot'),
(24, 'Celery'),
(25, 'Olive oil'),
(26, 'Oregano'),
(27, 'Parmesan cheese'),
(28, 'Salt'),
(29, 'Black pepper')
ON CONFLICT (ingredient_id) DO NOTHING;

-- Add Spaghetti Bolognese menu item
INSERT INTO menu_item (item_id, name, category, is_recipe_complete, notes) VALUES
(105, 'Spaghetti Bolognese', 'TAGESMENUE', TRUE,
 'Classic Italian pasta with meat sauce. Full recipe with IFEU CO2-mapped ingredients.')
ON CONFLICT (item_id) DO NOTHING;

-- Portion
INSERT INTO portion (portion_id, item_id, portion_label, serving_size_g, serving_size_ml, pricing_unit) VALUES
(6, 105, 'Standard plate', 450, NULL, 'per_portion')
ON CONFLICT (portion_id) DO NOTHING;

-- Compose ingredients with roles
INSERT INTO menu_item_ingredient (item_id, ingredient_id, role) VALUES
(105, 20, 'main'),      -- Spaghetti pasta
(105, 21, 'main'),      -- Ground beef
(105, 2,  'sauce'),     -- Tomato sauce (reuse existing id=2)
(105, 22, 'sauce'),     -- Onion
(105, 4,  'seasoning'), -- Garlic (reuse existing id=4)
(105, 23, 'sauce'),     -- Carrot
(105, 24, 'sauce'),     -- Celery
(105, 25, 'sauce'),     -- Olive oil
(105, 26, 'seasoning'), -- Oregano
(105, 27, 'topping'),   -- Parmesan cheese
(105, 28, 'seasoning'), -- Salt
(105, 29, 'seasoning')  -- Black pepper
ON CONFLICT (item_id, ingredient_id) DO NOTHING;

-- Allergens
INSERT INTO menu_item_allergen (item_id, allergen_id) VALUES
(105, 1),  -- Gluten (pasta)
(105, 2),  -- Wheat (pasta)
(105, 3),  -- Milk (parmesan)
(105, 5)   -- Celery
ON CONFLICT (item_id, allergen_id) DO NOTHING;

-- Tags
INSERT INTO menu_item_tag (item_id, tag_id) VALUES
(105, 3)   -- MensaVital
ON CONFLICT (item_id, tag_id) DO NOTHING;

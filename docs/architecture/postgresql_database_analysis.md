# PostgreSQL Database Architecture Analysis - IOMS POS System

## 📊 **Executive Summary**

This document provides a comprehensive analysis of the IOMS (Integrated Operations Management System) database architecture for PostgreSQL migration. The analysis covers 8 core functional areas with detailed data models, relationships, and implementation strategies.

---

## 🏗️ **System Architecture Overview**

### **Core Functional Areas:**
1. **User Management & Authentication**
2. **Menu Management & Recipe System**
3. **Inventory Management & Procurement**
4. **Order Processing & POS System**
5. **Table Management & Reservations**
6. **Waste Management (WasteWatchDog)**
7. **Analytics & Reporting**
8. **System Configuration & Settings**

---

## 📋 **1. USER MANAGEMENT & AUTHENTICATION**

### **Business Requirements:**
- Multi-tenant restaurant management
- Role-based access control (Owner, Admin, Staff, Driver)
- User authentication and session management
- Restaurant profile management

### **Data Models:**

#### **A. Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Multi-tenant support
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'driver')),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Restaurants Table**
```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    logo_url VARCHAR(255),
    currency VARCHAR(3) DEFAULT 'EUR',
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    tax_id VARCHAR(50), -- German tax compliance
    vat_number VARCHAR(50), -- EU VAT number
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **C. User Sessions Table**
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes:**
```sql
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
```

---

## 🍽️ **2. MENU MANAGEMENT & RECIPE SYSTEM**

### **Business Requirements:**
- Multi-category menu management
- Ingredient-based recipe system
- AI-powered menu extraction and optimization
- Dietary information and allergen tracking
- Menu versioning and seasonal management

### **Data Models:**

#### **A. Categories Table**
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);
```

#### **B. Ingredients Table**
```sql
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(50), -- e.g., 'vegetable', 'spice', 'protein'
    allergen_info JSONB, -- {allergens: ['gluten', 'dairy'], severity: 'high'}
    nutritional_info JSONB, -- {calories: 100, protein: 5, carbs: 20}
    supplier_info JSONB, -- {preferred_supplier: 'ABC Foods', cost_per_unit: 2.50}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);
```

#### **C. Menu Items Table**
```sql
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    image_url VARCHAR(255),
    preparation_time INTEGER, -- minutes
    serving_size INTEGER DEFAULT 1,
    dietary_info JSONB, -- {vegetarian: true, vegan: false, gluten_free: true}
    allergen_info JSONB, -- {allergens: ['nuts'], severity: 'medium'}
    ai_hint TEXT, -- AI-generated suggestions
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **D. Menu Item Ingredients Table (Many-to-Many)**
```sql
CREATE TABLE menu_item_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_item_id, ingredient_id)
);
```

#### **E. Menu Versions Table**
```sql
CREATE TABLE menu_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    version_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    valid_from DATE,
    valid_until DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes:**
```sql
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_ingredients_tenant_id ON ingredients(tenant_id);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_active ON menu_items(is_active);
CREATE INDEX idx_menu_item_ingredients_menu_item ON menu_item_ingredients(menu_item_id);
CREATE INDEX idx_menu_item_ingredients_ingredient ON menu_item_ingredients(ingredient_id);
```

---

## 📦 **3. INVENTORY MANAGEMENT & PROCUREMENT**

### **Business Requirements:**
- Real-time inventory tracking
- Multi-location inventory management
- Expiry date tracking and alerts
- Supplier management and procurement
- Automated reorder points and suggestions

### **Data Models:**

#### **A. Suppliers Table**
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    payment_terms VARCHAR(50), -- e.g., 'Net 30', 'COD'
    delivery_time_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Inventory Locations Table**
```sql
CREATE TABLE inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **C. Inventory Table**
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    location_id UUID NOT NULL REFERENCES inventory_locations(id),
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    min_stock_level DECIMAL(10,3) DEFAULT 0,
    max_stock_level DECIMAL(10,3),
    reorder_point DECIMAL(10,3) DEFAULT 0,
    expiry_date DATE,
    batch_number VARCHAR(50),
    supplier_id UUID REFERENCES suppliers(id),
    cost_per_unit DECIMAL(10,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **D. Inventory Transactions Table**
```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    location_id UUID NOT NULL REFERENCES inventory_locations(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'waste', 'adjustment', 'transfer'
    reference_id UUID, -- ID of the order, waste event, etc.
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **E. Procurement Orders Table**
```sql
CREATE TABLE procurement_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
    total_amount DECIMAL(10,2),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    actual_delivery DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **F. Procurement Order Items Table**
```sql
CREATE TABLE procurement_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES procurement_orders(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,3) DEFAULT 0,
    notes TEXT
);
```

### **Indexes:**
```sql
CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX idx_inventory_locations_tenant_id ON inventory_locations(tenant_id);
CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX idx_inventory_ingredient_id ON inventory(ingredient_id);
CREATE INDEX idx_inventory_location_id ON inventory(location_id);
CREATE INDEX idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX idx_inventory_transactions_tenant_id ON inventory_transactions(tenant_id);
CREATE INDEX idx_inventory_transactions_ingredient_id ON inventory_transactions(ingredient_id);
CREATE INDEX idx_procurement_orders_tenant_id ON procurement_orders(tenant_id);
CREATE INDEX idx_procurement_orders_supplier_id ON procurement_orders(supplier_id);
```

---

## 🛒 **4. ORDER PROCESSING & POS SYSTEM**

### **Business Requirements:**
- Multi-channel order processing (dine-in, takeaway, delivery)
- Real-time order status tracking
- Payment processing and transaction management
- Customer information management
- Order analytics and reporting

### **Data Models:**

#### **A. Customers Table**
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address JSONB, -- {street, city, postal_code, country}
    loyalty_points INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    preferences JSONB, -- {dietary_restrictions, favorite_items}
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Tables Table**
```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    number VARCHAR(20) NOT NULL,
    capacity INTEGER NOT NULL,
    zone_id UUID, -- For table grouping
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    current_waiter_id UUID REFERENCES users(id),
    occupied_since TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, number)
);
```

#### **C. Orders Table**
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    table_id UUID REFERENCES tables(id),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled')),
    customer_info JSONB, -- For non-registered customers
    delivery_info JSONB, -- {address, phone, delivery_time}
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **D. Order Items Table**
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **E. Transactions Table**
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id UUID REFERENCES orders(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'tip')),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_reference VARCHAR(100), -- External payment ID
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes:**
```sql
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_tables_tenant_id ON tables(tenant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);
```

---

## 🪑 **5. TABLE MANAGEMENT & RESERVATIONS**

### **Business Requirements:**
- Dynamic table layout management
- Reservation system with conflict detection
- Table status tracking and management
- Floor plan visualization
- Waiter assignment and management

### **Data Models:**

#### **A. Table Zones Table**
```sql
CREATE TABLE table_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Table Layouts Table**
```sql
CREATE TABLE table_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    layout_data JSONB NOT NULL, -- Table positions, zones, etc.
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **C. Reservations Table**
```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    table_id UUID NOT NULL REFERENCES tables(id),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    special_requests TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **D. Table Status History Table**
```sql
CREATE TABLE table_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id),
    status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes:**
```sql
CREATE INDEX idx_table_zones_tenant_id ON table_zones(tenant_id);
CREATE INDEX idx_table_layouts_tenant_id ON table_layouts(tenant_id);
CREATE INDEX idx_table_layouts_active ON table_layouts(is_active);
CREATE INDEX idx_reservations_tenant_id ON reservations(tenant_id);
CREATE INDEX idx_reservations_table_id ON reservations(table_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_table_status_history_table_id ON table_status_history(table_id);
```

---

## 🗑️ **6. WASTE MANAGEMENT (WASTEWATCHDOG)**

### **Business Requirements:**
- Real-time waste tracking and monitoring
- AI-powered waste analysis and insights
- Carbon footprint calculation
- Compliance reporting and alerts
- Cost impact analysis

### **Data Models:**

#### **A. Waste Categories Table**
```sql
CREATE TABLE waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    waste_type VARCHAR(50) NOT NULL CHECK (waste_type IN ('food', 'packaging', 'ingredient', 'oil', 'organic')),
    disposal_method VARCHAR(100),
    environmental_impact JSONB, -- {co2_per_kg: 2.5, water_usage: 100}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Waste Events Table**
```sql
CREATE TABLE waste_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES waste_categories(id),
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    waste_type VARCHAR(50) NOT NULL,
    station VARCHAR(50) NOT NULL, -- 'kitchen', 'bar', 'dining', 'storage'
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('expired', 'overproduction', 'spoiled', 'damaged', 'customer_return', 'preparation_waste')),
    cost_impact DECIMAL(10,2) NOT NULL,
    co2_impact DECIMAL(10,3) NOT NULL, -- kg CO2
    confidence_score DECIMAL(3,2), -- AI confidence (0-1)
    photo_url VARCHAR(255),
    notes TEXT,
    order_id UUID REFERENCES orders(id),
    created_by UUID REFERENCES users(id),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **C. Waste Analytics Table**
```sql
CREATE TABLE waste_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    total_waste_kg DECIMAL(10,3) NOT NULL,
    total_cost_eur DECIMAL(10,2) NOT NULL,
    total_co2_kg DECIMAL(10,3) NOT NULL,
    waste_by_category JSONB NOT NULL, -- {food: 15.5, packaging: 3.2}
    waste_by_station JSONB NOT NULL, -- {kitchen: 12.3, bar: 6.4}
    waste_by_reason JSONB NOT NULL, -- {expired: 8.1, overproduction: 10.7}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, date)
);
```

#### **D. Compliance Checks Table**
```sql
CREATE TABLE compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'minor')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    due_date DATE NOT NULL,
    assigned_to UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes:**
```sql
CREATE INDEX idx_waste_categories_tenant_id ON waste_categories(tenant_id);
CREATE INDEX idx_waste_events_tenant_id ON waste_events(tenant_id);
CREATE INDEX idx_waste_events_category_id ON waste_events(category_id);
CREATE INDEX idx_waste_events_occurred_at ON waste_events(occurred_at);
CREATE INDEX idx_waste_events_station ON waste_events(station);
CREATE INDEX idx_waste_analytics_tenant_id ON waste_analytics(tenant_id);
CREATE INDEX idx_waste_analytics_date ON waste_analytics(date);
CREATE INDEX idx_compliance_checks_tenant_id ON compliance_checks(tenant_id);
CREATE INDEX idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX idx_compliance_checks_due_date ON compliance_checks(due_date);
```

---

## 📊 **7. ANALYTICS & REPORTING**

### **Business Requirements:**
- Real-time business metrics and KPIs
- Historical data analysis and trends
- Custom report generation
- Export capabilities (PDF, Excel, CSV)
- Dashboard data aggregation

### **Data Models:**

#### **A. Analytics Events Table**
```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'order', 'inventory', 'waste', 'user'
    event_data JSONB NOT NULL,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Business Metrics Table**
```sql
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(20),
    metric_category VARCHAR(50) NOT NULL, -- 'revenue', 'cost', 'waste', 'efficiency'
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, metric_name, date, period_type)
);
```

#### **C. Reports Table**
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- 'financial', 'inventory', 'waste', 'custom'
    report_config JSONB NOT NULL, -- Report parameters and filters
    file_path VARCHAR(255),
    file_size INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### **Indexes:**
```sql
CREATE INDEX idx_analytics_events_tenant_id ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_business_metrics_tenant_id ON business_metrics(tenant_id);
CREATE INDEX idx_business_metrics_date ON business_metrics(date);
CREATE INDEX idx_business_metrics_category ON business_metrics(metric_category);
CREATE INDEX idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);
```

---

## ⚙️ **8. SYSTEM CONFIGURATION & SETTINGS**

### **Business Requirements:**
- Multi-tenant configuration management
- System settings and preferences
- Feature flags and module management
- Audit logging and system monitoring

### **Data Models:**

#### **A. System Settings Table**
```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(50) NOT NULL, -- 'general', 'inventory', 'orders', 'waste'
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);
```

#### **B. Feature Flags Table**
```sql
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    flag_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- 'inventory', 'waste', 'analytics'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, flag_name)
);
```

#### **C. Audit Logs Table**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'order', 'inventory', 'user'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **D. System Health Table**
```sql
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    response_time_ms INTEGER,
    error_message TEXT,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes:**
```sql
CREATE INDEX idx_system_settings_tenant_id ON system_settings(tenant_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_feature_flags_tenant_id ON feature_flags(tenant_id);
CREATE INDEX idx_feature_flags_module ON feature_flags(module);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_system_health_tenant_id ON system_health(tenant_id);
CREATE INDEX idx_system_health_service ON system_health(service_name);
```

---

## 🔗 **DATABASE RELATIONSHIPS & CONSTRAINTS**

### **Key Relationships:**
1. **Users ↔ Restaurants** (Many-to-One)
2. **Menu Items ↔ Categories** (Many-to-One)
3. **Menu Items ↔ Ingredients** (Many-to-Many via menu_item_ingredients)
4. **Orders ↔ Customers** (Many-to-One)
5. **Orders ↔ Tables** (Many-to-One)
6. **Orders ↔ Order Items** (One-to-Many)
7. **Inventory ↔ Ingredients** (Many-to-One)
8. **Waste Events ↔ Orders** (Many-to-One)

### **Foreign Key Constraints:**
```sql
-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id);
ALTER TABLE menu_items ADD CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE menu_item_ingredients ADD CONSTRAINT fk_menu_item_ingredients_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id);
ALTER TABLE menu_item_ingredients ADD CONSTRAINT fk_menu_item_ingredients_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id);
ALTER TABLE inventory ADD CONSTRAINT fk_inventory_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES tables(id);
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id);
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id);
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Partitioning Strategy:**
```sql
-- Partition analytics_events by month
CREATE TABLE analytics_events_y2024m01 PARTITION OF analytics_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Partition waste_events by month
CREATE TABLE waste_events_y2024m01 PARTITION OF waste_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### **Materialized Views:**
```sql
-- Daily business metrics
CREATE MATERIALIZED VIEW daily_business_metrics AS
SELECT 
    tenant_id,
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
GROUP BY tenant_id, DATE(created_at);

-- Inventory levels summary
CREATE MATERIALIZED VIEW inventory_summary AS
SELECT 
    i.tenant_id,
    i.ingredient_id,
    ing.name as ingredient_name,
    SUM(i.quantity) as total_quantity,
    AVG(i.cost_per_unit) as avg_cost
FROM inventory i
JOIN ingredients ing ON i.ingredient_id = ing.id
GROUP BY i.tenant_id, i.ingredient_id, ing.name;
```

---

## 🔒 **SECURITY & COMPLIANCE**

### **Row Level Security (RLS):**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation ON users
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON orders
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### **Data Encryption:**
```sql
-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt customer phone numbers
ALTER TABLE customers ADD COLUMN phone_encrypted BYTEA;
UPDATE customers SET phone_encrypted = pgp_sym_encrypt(phone, 'encryption_key');
```

---

## 📋 **MIGRATION STRATEGY**

### **Phase 1: Core Tables (Week 1-2)**
1. Users and Authentication
2. Restaurants and Tenants
3. Categories and Ingredients
4. Menu Items

### **Phase 2: Operations (Week 3-4)**
1. Inventory Management
2. Order Processing
3. Table Management
4. Customer Management

### **Phase 3: Advanced Features (Week 5-6)**
1. Waste Management
2. Analytics and Reporting
3. System Configuration
4. Audit Logging

### **Phase 4: Optimization (Week 7-8)**
1. Indexing and Performance
2. Partitioning
3. Materialized Views
4. Security Implementation

---

## 🎯 **NEXT STEPS**

1. **Review and Approve** this database architecture
2. **Set up PostgreSQL** development environment
3. **Create database schema** using provided SQL
4. **Implement data migration** scripts
5. **Test and validate** data integrity
6. **Deploy to production** with proper backup strategy

This comprehensive database architecture provides a solid foundation for the IOMS system with proper scalability, security, and compliance features for German restaurant operations.

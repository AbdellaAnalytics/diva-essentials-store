
-- Product size variants: [{label, price, stock}] (null = single-price product)
alter table products add column if not exists variants jsonb default null;

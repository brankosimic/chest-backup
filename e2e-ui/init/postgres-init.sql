CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL
);

INSERT INTO orders (customer, amount) VALUES ('dave', 5.25), ('erin', 10.75), ('frank', 20.00);

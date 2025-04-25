-- Seed data for Customers table
DELETE FROM Customers;
INSERT INTO Customers (CustomerId, CompanyName, ContactName) 
VALUES 
  (1, 'Alfreds Futterkiste', 'Maria Anders'),
  (4, 'Around the Horn', 'Thomas Hardy'),
  (11, 'Bs Beverages', 'Victoria Ashworth'),
  (13, 'Bs Beverages', 'Random Name');

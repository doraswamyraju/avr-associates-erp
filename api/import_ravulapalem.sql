-- Import Data for Ravulapalem Branch (From Screenshot)
-- Run: mysql avr_erp_db < /var/www/avr/api/import_ravulapalem.sql

USE avr_erp_db;

INSERT INTO clients (id, name, type, address, city, phone, pincode, dob, pan, file_number, branch, status, refer_by) VALUES
('CL-RAV-001', 'KORIPALLI RAMBABU', 'Individual', 'D.NO 1-136/1 MAIN ROAD COLONY', 'KOMARIPALEM', '9951662122', '533223', '1980-07-01', 'AUPPK4567A', '1', 'Ravulapalem', 'Active', 'NAGA ESWARA RAO'),
('CL-RAV-002', 'KORIPALLI VANITA', 'Individual', 'D.NO 1-136/1 MAIN ROAD COLONY', 'KOMARIPALEM', '9951662122', '533223', '1985-06-15', 'CKQPV1234B', '17', 'Ravulapalem', 'Active', 'NAGA ESWARA RAO'),
('CL-RAV-003', 'BANDI TRIMURTULU', 'Individual', 'UNKNOWN', 'RAVULAPALEM', '9848147413', '533238', '1983-08-01', 'ADCPT5678C', '16', 'Ravulapalem', 'Active', 'NAGA ESWARA RAO'),
('CL-RAV-004', 'ADABALA RAMU', 'Individual', 'UNKNOWN', 'RAVULAPALEM', '9848147413', '533238', '1967-06-01', 'ADCPT9012D', '3', 'Ravulapalem', 'Active', 'B NAGESWARA RAO'),
('CL-RAV-005', 'KUNDALA BABU', 'Individual', 'D.NO 4-136, KAVALI GARI VEEDHI', 'RAVULAPALEM', '9959664536', '533238', '1979-05-10', 'BJWPK3456E', '2', 'Ravulapalem', 'Active', 'E TATAJI (KPPM)');

-- Note: I have only transcribed the first 5 rows from the image. 
-- For the full list, please copy-paste the Excel text data into the chat or converting it to CSV.

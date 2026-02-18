-- Create medicine_orders table
CREATE TABLE IF NOT EXISTS medicine_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for medicine_orders
CREATE INDEX IF NOT EXISTS idx_medicine_orders_doctor_id ON medicine_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_medicine_id ON medicine_orders(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_status ON medicine_orders(status);

-- Insert some sample medicines with low stock for testing
INSERT INTO medicines (name, generic_name, manufacturer, category, stock_quantity, reorder_level, unit_price) VALUES
('Paracetamol', 'Acetaminophen', 'Pharma Corp', 'Pain Relief', 5, 20, 25.00),
('Amoxicillin', 'Amoxicillin', 'MediCare Ltd', 'Antibiotics', 8, 15, 120.00),
('Ibuprofen', 'Ibuprofen', 'Health Plus', 'Pain Relief', 12, 25, 35.00),
('Cetirizine', 'Cetirizine', 'Allergy Care', 'Antihistamine', 3, 10, 45.00),
('Metformin', 'Metformin', 'Diabetes Care', 'Diabetes', 7, 20, 85.00),
('Aspirin', 'Acetylsalicylic Acid', 'Heart Care', 'Blood Thinner', 15, 30, 20.00),
('Omeprazole', 'Omeprazole', 'Gastro Care', 'Antacid', 20, 25, 65.00),
('Salbutamol', 'Albuterol', 'Respiratory Care', 'Bronchodilator', 4, 15, 95.00);

-- Insert some medicines with good stock
INSERT INTO medicines (name, generic_name, manufacturer, category, stock_quantity, reorder_level, unit_price) VALUES
('Vitamin C', 'Ascorbic Acid', 'NutriHealth', 'Supplements', 150, 50, 15.00),
('Calcium Tablets', 'Calcium Carbonate', 'Bone Health', 'Supplements', 200, 75, 45.00),
('Insulin', 'Human Insulin', 'Diabetes Pharma', 'Diabetes', 80, 30, 450.00);

SELECT 'Migration completed successfully!' as status;

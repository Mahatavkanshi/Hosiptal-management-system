import { query } from '../config/database';

export const createTables = async (): Promise<void> => {
  try {
    console.log('Creating database tables...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        phone_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Doctors profile
    await query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        specialization VARCHAR(100) NOT NULL,
        qualification TEXT NOT NULL,
        experience_years INT DEFAULT 0,
        consultation_fee DECIMAL(10,2) DEFAULT 0,
        license_number VARCHAR(100) UNIQUE,
        available_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]'::jsonb,
        available_time_start TIME DEFAULT '09:00',
        available_time_end TIME DEFAULT '17:00',
        slot_duration INT DEFAULT 30,
        is_available BOOLEAN DEFAULT true,
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INT DEFAULT 0,
        about TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Patients profile
    await query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth DATE,
        blood_group VARCHAR(5),
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        insurance_provider VARCHAR(100),
        insurance_policy_number VARCHAR(100),
        allergies TEXT,
        chronic_conditions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Appointments
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        end_time TIME,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'in_progress')),
        type VARCHAR(20) DEFAULT 'in_person' CHECK (type IN ('in_person', 'video')),
        symptoms TEXT,
        notes TEXT,
        queue_number INT,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
        payment_amount DECIMAL(10,2),
        video_call_room_id VARCHAR(100),
        video_call_started_at TIMESTAMP,
        video_call_ended_at TIMESTAMP,
        cancellation_reason TEXT,
        cancelled_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medical records
    await query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        visit_date DATE DEFAULT CURRENT_DATE,
        diagnosis TEXT,
        chief_complaint TEXT,
        examination_notes TEXT,
        prescription TEXT,
        follow_up_date DATE,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Beds management
    await query(`
      CREATE TABLE IF NOT EXISTS beds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bed_number VARCHAR(20) NOT NULL,
        ward_type VARCHAR(20) NOT NULL CHECK (ward_type IN ('general', 'semi_private', 'private', 'icu', 'ccu', 'emergency')),
        floor_number INT NOT NULL,
        room_number VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'reserved')),
        patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
        assigned_date DATE,
        discharge_date DATE,
        daily_charge DECIMAL(10,2) DEFAULT 0,
        amenities JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(floor_number, room_number, bed_number)
      )
    `);

    // Medicines inventory
    await query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        generic_name VARCHAR(200),
        manufacturer VARCHAR(200),
        category VARCHAR(100),
        description TEXT,
        dosage_form VARCHAR(50),
        strength VARCHAR(50),
        stock_quantity INT DEFAULT 0,
        unit_price DECIMAL(10,2) DEFAULT 0,
        cost_price DECIMAL(10,2) DEFAULT 0,
        expiry_date DATE,
        batch_number VARCHAR(100),
        reorder_level INT DEFAULT 10,
        storage_conditions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Prescriptions
    await query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
        medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
        medicine_name VARCHAR(200) NOT NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        duration VARCHAR(100) NOT NULL,
        instructions TEXT,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi', 'insurance', 'netbanking')),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        razorpay_signature VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded', 'cancelled')),
        payment_type VARCHAR(20) CHECK (payment_type IN ('consultation', 'bed', 'medicine', 'lab_test', 'registration')),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        old_values JSONB DEFAULT '{}'::jsonb,
        new_values JSONB DEFAULT '{}'::jsonb,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medicine orders (for doctors to request medicines)
    await query(`
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
      )
    `);

    // Create indexes for better performance
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await query('CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)');
    await query('CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_medicine_orders_doctor_id ON medicine_orders(doctor_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_medicine_orders_medicine_id ON medicine_orders(medicine_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_medicine_orders_status ON medicine_orders(status)');

    // Seed dummy medicines if none exist
    const medicinesCount = await query('SELECT COUNT(*) as count FROM medicines');
    if (parseInt(medicinesCount.rows[0].count) === 0) {
      console.log('Seeding dummy medicines...');
      await query(`
        INSERT INTO medicines (name, generic_name, manufacturer, category, description, dosage_form, strength, stock_quantity, unit_price, cost_price, reorder_level, storage_conditions)
        VALUES 
          ('Ibuprofen', 'Ibuprofen', 'Generic Pharma', 'Pain Relief', 'Nonsteroidal anti-inflammatory drug', 'Tablet', '400mg', 2, 15.00, 8.00, 25, 'Store at room temperature'),
          ('Aspirin', 'Acetylsalicylic Acid', 'Bayer', 'Pain Relief', 'Pain reliever and fever reducer', 'Tablet', '325mg', 8, 12.00, 6.00, 30, 'Store in cool dry place'),
          ('Omeprazole', 'Omeprazole Magnesium', 'Dr. Reddys', 'Gastrointestinal', 'Proton pump inhibitor for acid reflux', 'Capsule', '20mg', 4, 45.00, 25.00, 25, 'Store below 30°C'),
          ('Paracetamol', 'Acetaminophen', 'Cipla', 'Pain Relief', 'Pain reliever and fever reducer', 'Tablet', '500mg', 5, 10.00, 5.00, 20, 'Store at room temperature'),
          ('Metformin', 'Metformin Hydrochloride', 'Sun Pharma', 'Diabetes', 'Oral diabetes medicine', 'Tablet', '500mg', 6, 35.00, 18.00, 20, 'Store in cool dry place'),
          ('Salbutamol', 'Salbutamol Sulfate', 'Cipla', 'Respiratory', 'Bronchodilator for asthma', 'Inhaler', '100mcg', 2, 125.00, 70.00, 15, 'Store below 25°C'),
          ('Amoxicillin', 'Amoxicillin Trihydrate', 'Lupin', 'Antibiotic', 'Penicillin antibiotic', 'Capsule', '500mg', 3, 25.00, 12.00, 15, 'Store in refrigerator'),
          ('Cetirizine', 'Cetirizine Hydrochloride', 'Dr. Reddys', 'Antihistamine', 'Antihistamine for allergies', 'Tablet', '10mg', 4, 18.00, 9.00, 15, 'Store at room temperature'),
          ('Azithromycin', 'Azithromycin Dihydrate', 'Pfizer', 'Antibiotic', 'Macrolide antibiotic', 'Tablet', '500mg', 3, 55.00, 28.00, 12, 'Store below 30°C')
      `);
      console.log('Dummy medicines seeded successfully!');
    }

    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Drop all tables (use with caution!)
export const dropTables = async (): Promise<void> => {
  try {
    console.log('Dropping all tables...');
    
    await query('DROP TABLE IF EXISTS audit_logs CASCADE');
    await query('DROP TABLE IF EXISTS notifications CASCADE');
    await query('DROP TABLE IF EXISTS payments CASCADE');
    await query('DROP TABLE IF EXISTS prescriptions CASCADE');
    await query('DROP TABLE IF EXISTS medicines CASCADE');
    await query('DROP TABLE IF EXISTS beds CASCADE');
    await query('DROP TABLE IF EXISTS medical_records CASCADE');
    await query('DROP TABLE IF EXISTS appointments CASCADE');
    await query('DROP TABLE IF EXISTS patients CASCADE');
    await query('DROP TABLE IF EXISTS doctors CASCADE');
    await query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('All tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};

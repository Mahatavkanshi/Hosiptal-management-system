import { query } from '../config/database';

export const createTables = async (): Promise<void> => {
  try {
    console.log('Creating database tables...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, role)
      )
    `);

    // Alter existing table to support multiple roles per email (if table already exists)
    try {
      // First, drop the old unique constraint on email only
      await query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_email_key
      `);
      console.log('Dropped old email unique constraint');
    } catch (err) {
      console.log('Old constraint not found or already dropped');
    }
    
    try {
      // Add new composite unique constraint
      await query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_email_role_key UNIQUE (email, role)
      `);
      console.log('Added new email+role unique constraint');
    } catch (err) {
      console.log('Composite constraint may already exist or conflict with existing data');
    }

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

    // Expenses tracking for hospital operational costs
    await query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL CHECK (category IN ('salary', 'utilities', 'maintenance', 'supplies', 'equipment', 'rent', 'marketing', 'other')),
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        vendor_name VARCHAR(200),
        vendor_contact VARCHAR(100),
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi', 'netbanking', 'cheque')),
        expense_date DATE NOT NULL,
        receipt_url TEXT,
        status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vendor payments for tracking supplier payments
    await query(`
      CREATE TABLE IF NOT EXISTS vendor_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_name VARCHAR(200) NOT NULL,
        vendor_contact VARCHAR(100),
        vendor_email VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        invoice_number VARCHAR(100),
        invoice_date DATE,
        due_date DATE,
        payment_date DATE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi', 'netbanking', 'cheque')),
        razorpay_payment_id VARCHAR(100),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insurance claims tracking
    await query(`
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        claim_number VARCHAR(100) UNIQUE NOT NULL,
        insurance_company VARCHAR(200) NOT NULL,
        policy_number VARCHAR(100),
        claim_amount DECIMAL(10,2) NOT NULL,
        approved_amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'settled')),
        submission_date DATE NOT NULL,
        approval_date DATE,
        settlement_date DATE,
        rejection_reason TEXT,
        documents JSONB DEFAULT '[]'::jsonb,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payroll/Salary records
    await query(`
      CREATE TABLE IF NOT EXISTS payroll_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        month VARCHAR(20) NOT NULL,
        year INTEGER NOT NULL,
        basic_salary DECIMAL(10,2) NOT NULL,
        hra DECIMAL(10,2) DEFAULT 0,
        da DECIMAL(10,2) DEFAULT 0,
        ta DECIMAL(10,2) DEFAULT 0,
        medical_allowance DECIMAL(10,2) DEFAULT 0,
        other_allowances DECIMAL(10,2) DEFAULT 0,
        gross_salary DECIMAL(10,2) NOT NULL,
        pf_deduction DECIMAL(10,2) DEFAULT 0,
        tds_deduction DECIMAL(10,2) DEFAULT 0,
        professional_tax DECIMAL(10,2) DEFAULT 0,
        other_deductions DECIMAL(10,2) DEFAULT 0,
        total_deductions DECIMAL(10,2) NOT NULL,
        net_salary DECIMAL(10,2) NOT NULL,
        working_days INTEGER,
        present_days INTEGER,
        leave_days INTEGER,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
        payment_date DATE,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque')),
        bank_account_number VARCHAR(50),
        ifsc_code VARCHAR(20),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year)
      )
    `);

    // Invoices for billing
    await query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        tax_percentage DECIMAL(5,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        balance_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
        invoice_date DATE NOT NULL,
        due_date DATE,
        paid_date DATE,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'upi', 'netbanking', 'cheque', 'insurance')),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoice items (line items for each invoice)
    await query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
        item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('consultation', 'procedure', 'medicine', 'bed', 'lab_test', 'other')),
        item_name VARCHAR(200) NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    // Indexes for financial tables
    await query('CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)');
    await query('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON vendor_payments(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_vendor_payments_due_date ON vendor_payments(due_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient_id ON insurance_claims(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_payroll_user_id ON payroll_records(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON payroll_records(month, year)');
    await query('CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)');

    // Nurse Shift Management Tables
    await query(`
      CREATE TABLE IF NOT EXISTS shift_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
        shift_date DATE NOT NULL,
        shift_type VARCHAR(20) CHECK (shift_type IN ('day', 'night', 'rotating')),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        department VARCHAR(50),
        floor_number INTEGER,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS shift_handovers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        from_nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
        to_nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
        handover_notes TEXT NOT NULL,
        critical_flags JSONB DEFAULT '[]'::jsonb,
        vital_changes JSONB DEFAULT '{}'::jsonb,
        medication_updates TEXT,
        acknowledged BOOLEAN DEFAULT false,
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS shift_swaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requestor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        requested_nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
        original_shift_id UUID REFERENCES shift_schedules(id) ON DELETE CASCADE,
        proposed_shift_date DATE NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS overtime_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
        overtime_date DATE NOT NULL,
        regular_hours DECIMAL(4,2) DEFAULT 8.00,
        overtime_hours DECIMAL(4,2) NOT NULL,
        reason TEXT,
        approved BOOLEAN DEFAULT false,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Care Plans & Documentation
    await query(`
      CREATE TABLE IF NOT EXISTS care_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        plan_type VARCHAR(50) NOT NULL,
        diagnosis TEXT,
        goals TEXT[],
        interventions TEXT[],
        schedule JSONB,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS nursing_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
        note_type VARCHAR(30) CHECK (note_type IN ('general', 'vitals', 'medication', 'procedure', 'assessment')),
        content TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        is_critical BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS wound_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
        wound_location VARCHAR(100) NOT NULL,
        wound_stage INTEGER CHECK (wound_stage BETWEEN 1 AND 4),
        length_cm DECIMAL(5,2),
        width_cm DECIMAL(5,2),
        depth_cm DECIMAL(5,2),
        appearance TEXT,
        drainage VARCHAR(50),
        photos JSONB DEFAULT '[]'::jsonb,
        pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
        treatment_applied TEXT,
        next_assessment_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS gcs_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
        eye_response INTEGER CHECK (eye_response BETWEEN 1 AND 4),
        verbal_response INTEGER CHECK (verbal_response BETWEEN 1 AND 5),
        motor_response INTEGER CHECK (motor_response BETWEEN 1 AND 6),
        total_score INTEGER CHECK (total_score BETWEEN 3 AND 15),
        assessment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    // Communication Tables
    await query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_type VARCHAR(20) CHECK (room_type IN ('private', 'group', 'department')),
        name VARCHAR(200),
        participants UUID[] DEFAULT '{}'::uuid[],
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice')),
        content TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        read_by UUID[] DEFAULT '{}'::uuid[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS emergency_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('code_blue', 'code_red', 'code_pink', 'fire', 'evacuation')),
        location VARCHAR(200) NOT NULL,
        triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
        description TEXT,
        responders UUID[] DEFAULT '{}'::uuid[],
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS video_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id VARCHAR(100) UNIQUE NOT NULL,
        caller_id UUID REFERENCES users(id) ON DELETE SET NULL,
        callee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        call_type VARCHAR(20) CHECK (call_type IN ('nurse_to_doctor', 'nurse_to_patient')),
        status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN ('initiated', 'ongoing', 'completed', 'missed', 'rejected')),
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        duration_seconds INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reports & Analytics
    await query(`
      CREATE TABLE IF NOT EXISTS nurse_performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
        metric_date DATE NOT NULL,
        patients_cared INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        tasks_pending INTEGER DEFAULT 0,
        response_time_avg_seconds INTEGER,
        shift_adherence_percentage DECIMAL(5,2),
        notes_documented INTEGER DEFAULT 0,
        incidents_reported INTEGER DEFAULT 0,
        quality_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nurse_id, metric_date)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS daily_nurse_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nurse_id UUID REFERENCES users(id) ON DELETE CASCADE,
        report_date DATE NOT NULL,
        shift_id UUID REFERENCES shift_schedules(id) ON DELETE SET NULL,
        summary TEXT,
        key_events JSONB DEFAULT '[]'::jsonb,
        patients_handled INTEGER DEFAULT 0,
        critical_incidents INTEGER DEFAULT 0,
        medications_administered INTEGER DEFAULT 0,
        handover_completed BOOLEAN DEFAULT false,
        handover_notes TEXT,
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS incident_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        incident_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
        location VARCHAR(200),
        incident_date TIMESTAMP NOT NULL,
        description TEXT NOT NULL,
        immediate_action TEXT,
        witnesses JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'under_investigation', 'resolved', 'closed')),
        investigation_notes TEXT,
        corrective_actions TEXT,
        closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for nurse tables
    await query('CREATE INDEX IF NOT EXISTS idx_shift_schedules_nurse_id ON shift_schedules(nurse_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON shift_schedules(shift_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_shift_handovers_patient_id ON shift_handovers(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_shift_swaps_status ON shift_swaps(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_nursing_notes_patient_id ON nursing_notes(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_wound_assessments_patient_id ON wound_assessments(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_gcs_assessments_patient_id ON gcs_assessments(patient_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_nurse_performance_nurse_id ON nurse_performance_metrics(nurse_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_daily_reports_nurse_id ON daily_nurse_reports(nurse_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status)');

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

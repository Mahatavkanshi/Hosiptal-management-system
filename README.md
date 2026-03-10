# 🏥 Hospital Management System

A comprehensive, full-stack Hospital Management System built with modern technologies including React, Node.js, Express, TypeScript, and PostgreSQL. This system provides complete healthcare management with role-based access, video consultations, and integrated payments.

## 📸 Screenshots

<img src="backend/images/ROLES.png" alt="Role Selection Portal" width="800"/>

**Role Selection Portal** - Department-based entry for all hospital roles.

<img src="backend/images/dashboard%20%282%29.png" alt="Main Dashboard" width="800"/>

**Main Dashboard** - Overview cards and operational status at a glance.

<img src="backend/images/doctors.png" alt="Doctor Dashboard" width="800"/>

**Doctor Dashboard** - Patient care workflow, appointments, and clinical actions.

<img src="backend/images/patient.png" alt="Patient Portal" width="800"/>

**Patient Portal** - Appointments, records, prescriptions, and health access.

<img src="backend/images/receptionist.png" alt="Reception Dashboard" width="800"/>

**Reception Dashboard** - Queue, admissions, and front-desk operations.

<img src="backend/images/pharmacy.png" alt="Pharmacy Dashboard" width="800"/>

**Pharmacy Dashboard** - Inventory tracking, orders, and medicine workflows.

<img src="backend/images/admin%20%282%29.png" alt="Admin Dashboard" width="800"/>

**Admin Dashboard** - User management, controls, and hospital-wide administration.

<img src="backend/images/nurse.png" alt="Nurse Dashboard" width="800"/>

**Nurse Dashboard** - Care tasks, vitals workflow, and ward support.

<img src="backend/images/medicine.png" alt="Medicine Module" width="800"/>

**Medicine Module** - Catalog and stock-level management for pharmacy operations.

<img src="backend/images/prescription.png" alt="Prescription Module" width="800"/>

**Prescription Module** - Digital prescriptions and medication instructions.

<img src="backend/images/payment.png" alt="Payment Module" width="800"/>

**Payment Module** - Billing, payment collection, and transaction tracking.

<img src="backend/images/bed.png" alt="Bed Management" width="800"/>

**Bed Management** - Bed allocation, occupancy status, and availability overview.

<img src="backend/images/reports.png" alt="Reports Module" width="800"/>

**Reports Module** - Operational and clinical reporting for decision support.

<img src="backend/images/ai-assistant.png" alt="AI Assistant" width="800"/>

**AI Assistant** - Intelligent support for symptom/clinical assistance workflows.

---

## ✨ Features

### 🎯 Core Modules

1. **👥 Multi-Role User Management**
   - 7 User Roles: Super Admin, Admin, Doctor, Nurse, Receptionist, Patient, Pharmacist
   - JWT-based Authentication with secure token handling
   - Role-based Access Control (RBAC)
   - User Profile Management with medical history

2. **📅 Advanced Appointment System**
   - Online appointment booking with doctor selection
   - Real-time queue management with token numbers
   - Doctor availability management
   - Video consultation support with payment integration
   - In-person visit tracking with receptionist tokens
   - SMS/Email notifications

3. **🏥 Patient Portal**
   - Modern, responsive dashboard design
   - Upcoming appointments with token numbers
   - Medical history tracking
   - Digital prescriptions with download/print
   - Payment history and outstanding balance
   - Telemedicine video calls

4. **🩺 Interactive Medical History**
   - Visual body system overview
   - Critical, Monitor, and Healthy area tracking
   - Detailed medical records by body part
   - Prescription management
   - Downloadable medical reports

5. **🛏️ Bed Management**
   - Visual floor plan interface
   - Real-time bed availability
   - Patient allocation/deallocation
   - Ward-wise categorization

6. **💊 Pharmacy & Inventory**
   - Complete medicine stock management
   - Low stock alerts with reorder functionality
   - Expiry tracking and alerts
   - Prescription fulfillment
   - Purchase order management
   - Financial tracking

7. **💳 Integrated Payment System**
   - Razorpay integration for secure payments
   - Multiple payment methods (Cash, Card, UPI, Insurance)
   - Invoice generation and download
   - Payment history tracking
   - Outstanding balance management

8. **📊 Admin Dashboard**
   - Analytics and reports
   - User management and role assignment
   - Audit logs
   - Revenue analytics
   - System configuration

9. **🎥 Video Consultation**
   - WebRTC-based video calls
   - Pre-payment integration
   - Doctor availability display
   - Call history and recordings

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **File Storage**: Cloudinary / AWS S3
- **Payment Gateway**: Razorpay
- **SMS**: Twilio
- **Email**: Nodemailer / SendGrid

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Data Fetching**: REST API with Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Custom components
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
hospital-management-system/
├── backend/
│   ├── src/
│   │   ├── config/           # Database & app configuration
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Auth & error handling
│   │   ├── routes/           # API routes
│   │   ├── types/            # TypeScript types
│   │   └── server.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/          # React contexts
│   │   ├── pages/            # Page components
│   │   │   ├── dashboard/    # All dashboard pages
│   │   │   ├── appointments/ # Appointment management
│   │   │   ├── medicines/    # Pharmacy & inventory
│   │   │   └── patients/     # Patient portal
│   │   ├── routes/           # Route configuration
│   │   └── services/         # API services
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hospital-management-system.git
   cd hospital-management-system
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   Or manually:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Setup**

   Backend (`backend/.env`):
   ```env
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/hospital_db
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

   Frontend (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run the application**
   ```bash
   # From root directory
   npm run dev
   
   # Or run separately
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## 📱 Application Flow

### For Patients:
1. **Registration**: Create account with basic details
2. **Dashboard**: View upcoming appointments, medical records, and balance
3. **Book Appointment**: Select doctor, date, time, and consultation type
4. **Hospital Visit**: Receive token number from receptionist
5. **Video Consultation**: Join call after payment
6. **Payments**: View and pay bills online
7. **Records**: Access medical history and download prescriptions

### For Doctors:
1. **Dashboard**: View today's and upcoming appointments
2. **Patient Management**: Access patient medical history
3. **Video Calls**: Conduct online consultations
4. **Prescriptions**: Write and manage prescriptions
5. **Schedule**: Manage availability

### For Admin:
1. **User Management**: Create and manage all users
2. **Analytics**: View hospital statistics and revenue
3. **System Config**: Manage beds, medicines, and settings
4. **Reports**: Generate various reports

## 🔐 User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **Super Admin** | System administrator | Full system access, user management |
| **Admin** | Hospital administrator | Manage staff, view reports, manage beds |
| **Doctor** | Medical doctor | View patients, write prescriptions, video calls |
| **Nurse** | Hospital nurse | Bed management, assist doctors |
| **Receptionist** | Front desk staff | Appointment booking, token generation, patient registration |
| **Patient** | Hospital patient | Book appointments, view history, payments, video calls |
| **Pharmacist** | Pharmacy staff | Medicine management, prescriptions, inventory |

## 🎨 UI/UX Features

- **Modern Dashboard**: Clean, responsive design with Tailwind CSS
- **Interactive Body Map**: Visual medical history representation
- **Token System**: Receptionist-assigned appointment numbers
- **Professional Prescriptions**: Downloadable PDF format
- **Real-time Updates**: Live appointment status and notifications
- **Mobile Responsive**: Works on all device sizes
- **Theme Support**: Light and dark mode support

## 💡 Key Features Implemented

### Patient Dashboard
- ✅ Welcome banner with quick actions
- ✅ Stats cards (Records, Balance, Appointments, Prescriptions)
- ✅ Upcoming appointments with token numbers
- ✅ Recent medical records
- ✅ Modern card-based layout
- ✅ Video consultation integration

### Appointment System
- ✅ Multi-step booking wizard
- ✅ Doctor search and selection
- ✅ Date and time slot selection
- ✅ Video vs In-person options
- ✅ Token number assignment for hospital visits
- ✅ Payment integration for video calls

### Medical Records
- ✅ Interactive body system visualization
- ✅ Critical/Monitor/Healthy area tracking
- ✅ Detailed record history
- ✅ Prescription management
- ✅ Downloadable reports

### Pharmacy
- ✅ Medicine inventory management
- ✅ Stock movement tracking
- ✅ Low stock alerts
- ✅ Expiry tracking
- ✅ Purchase order management
- ✅ Financial reporting

### Payments
- ✅ Razorpay integration
- ✅ Multiple payment methods
- ✅ Bill management
- ✅ Payment history
- ✅ Invoice generation

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/status` - Update status

### Patients
- `GET /api/patients/medical-history` - Get medical history
- `GET /api/patients/prescriptions` - Get prescriptions
- `POST /api/patients/records` - Add medical record

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history

### Pharmacy
- `GET /api/medicines` - List medicines
- `GET /api/medicines/inventory` - Get inventory
- `POST /api/medicines/orders` - Create purchase order
- `GET /api/pharmacy/finance` - Get financial data

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📝 Environment Variables

### Backend
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/hospital_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database exists

2. **Payment Gateway Not Working**
   - Verify Razorpay keys in .env
   - Check if Razorpay dashboard is configured
   - Ensure callback URLs are correct

3. **Build Errors**
   - Run `npm install` in both frontend and backend
   - Check TypeScript version compatibility
   - Clear node_modules and reinstall

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Team for the amazing frontend library
- Express.js Team for the robust backend framework
- PostgreSQL Team for the reliable database
- Tailwind CSS Team for the utility-first CSS framework
- Razorpay for payment gateway integration
- All contributors and testers

## 📞 Support

For support, email: support@hospitalms.com

## 🔗 Links

- [Live Demo](https://your-demo-link.com)
- [Documentation](https://your-docs-link.com)
- [Issue Tracker](https://github.com/yourusername/hospital-management-system/issues)

---

Made with ❤️ by the Hospital MS Team

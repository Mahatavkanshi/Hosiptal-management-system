# Hospital Management System

A comprehensive full-stack Hospital Management System built with React, Node.js, Express, TypeScript, and PostgreSQL.

## Features

### Core Modules

1. **User Management**
   - 7 User Roles: Super Admin, Admin, Doctor, Nurse, Receptionist, Patient, Pharmacist
   - JWT-based Authentication
   - Role-based Access Control (RBAC)
   - User Profile Management

2. **Appointment System**
   - Online appointment booking
   - Real-time queue management
   - Doctor availability management
   - Video consultation support
   - SMS/Email notifications

3. **Patient Management**
   - Patient registration
   - Medical history tracking
   - Digital prescriptions
   - Document upload (OCR-based)

4. **Bed Management**
   - Visual floor plan
   - Real-time bed availability
   - Patient allocation/deallocation
   - Ward-wise categorization

5. **Pharmacy & Inventory**
   - Medicine stock management
   - Low stock alerts
   - Expiry tracking
   - Prescription fulfillment

6. **Payment System**
   - Razorpay integration
   - Multiple payment methods (Cash, Card, UPI, Insurance)
   - Invoice generation
   - Revenue analytics

7. **Admin Dashboard**
   - Analytics and reports
   - User management
   - Audit logs
   - System configuration

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **File Storage**: Cloudinary / AWS S3
- **Payment**: Razorpay
- **SMS**: Twilio
- **Email**: Nodemailer / SendGrid

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Build Tool**: Vite

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── migrations.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── doctor.routes.ts
│   │   │   ├── patient.routes.ts
│   │   │   ├── appointment.routes.ts
│   │   │   ├── bed.routes.ts
│   │   │   ├── medicine.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── video.routes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── AuthLayout.tsx
│   │   │       └── MainLayout.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ForgotPassword.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── appointments/
│   │   │   ├── doctors/
│   │   │   ├── patients/
│   │   │   ├── beds/
│   │   │   ├── medicines/
│   │   │   ├── admin/
│   │   │   ├── profile/
│   │   │   ├── video/
│   │   │   └── NotFound.tsx
│   │   ├── routes/
│   │   │   └── index.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (optional, for caching)
- npm or yarn

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   - Database credentials
   - JWT secrets
   - API keys (Razorpay, Twilio, Cloudinary)

3. **Database Setup**:
   ```bash
   # Create database
   createdb hospital_management
   
   # Run migrations
   npm run db:migrate
   
   # (Optional) Seed data
   npm run db:seed
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

### Running Both (Root Directory)

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/change-password` - Change password

### Doctors
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/:id/availability` - Check availability
- `PUT /api/doctors/:id/availability` - Update availability

### Patients
- `GET /api/patients/medical-history` - Get medical history
- `GET /api/patients/prescriptions` - Get prescriptions
- `GET /api/patients/appointments` - Get appointments

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/status` - Update status
- `POST /api/appointments/:id/cancel` - Cancel appointment

### Beds
- `GET /api/beds` - List beds
- `GET /api/beds/availability` - Get availability
- `POST /api/beds/allocate` - Allocate bed
- `POST /api/beds/:id/discharge` - Discharge patient
- `POST /api/beds` - Create new bed (Admin)

### Medicines
- `GET /api/medicines` - List medicines
- `POST /api/medicines` - Add medicine
- `PUT /api/medicines/:id/stock` - Update stock
- `GET /api/medicines/inventory/low-stock` - Get low stock
- `GET /api/medicines/inventory/expiring` - Get expiring medicines

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history
- `GET /api/payments/stats/overview` - Payment statistics

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id/status` - Toggle user status
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/revenue-analytics` - Revenue reports

## User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|----------------|
| Super Admin | System administrator | Full system access |
| Admin | Hospital administrator | Manage staff, view reports, manage beds |
| Doctor | Medical doctor | View patients, write prescriptions, video calls |
| Nurse | Hospital nurse | Bed management, assist doctors |
| Receptionist | Front desk | Appointment booking, patient registration |
| Patient | Hospital patient | Book appointments, view history, payments |
| Pharmacist | Pharmacy staff | Medicine management, prescriptions |

## Development Timeline (12-14 Weeks)

### Phase 1 (Weeks 1-2): Foundation
- [x] Project setup and configuration
- [x] Database schema design
- [x] Authentication system
- [x] Basic API structure

### Phase 2 (Weeks 3-5): Core Features
- [ ] Appointment booking system
- [ ] Doctor management
- [ ] Patient dashboard

### Phase 3 (Weeks 6-7): Medical Records
- [ ] Medical records module
- [ ] Prescription management
- [ ] Document upload (OCR)

### Phase 4 (Weeks 8-9): Advanced Features
- [ ] Payment integration
- [ ] SMS/Email notifications
- [ ] Bed management

### Phase 5 (Weeks 10-11): Video Consultation
- [ ] WebRTC integration
- [ ] Video call UI
- [ ] Real-time features

### Phase 6 (Weeks 12-13): Admin & Analytics
- [ ] Admin dashboard
- [ ] Reports and analytics
- [ ] User management

### Phase 7 (Week 14): Testing & Deployment
- [ ] Testing and bug fixes
- [ ] Documentation
- [ ] Deployment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@hospitalms.com or join our Slack channel.

## Acknowledgments

- React team for the amazing frontend library
- Express.js team for the backend framework
- PostgreSQL team for the robust database
- Tailwind CSS team for the utility-first CSS framework

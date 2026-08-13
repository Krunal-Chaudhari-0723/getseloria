# 💎 Seloria — Jewelry E-Commerce Platform

**Seloria** is a modern, full-stack jewelry e-commerce platform built to provide a premium online shopping experience with secure authentication, product management, online payments, and a dedicated admin panel.

🌐 **Live Website:** https://www.getseloria.com

---

## ✨ Features

### 🛍️ Customer Features

* Browse jewelry products
* Product details and categories
* Shopping cart
* User authentication
* Secure login & registration
* Password reset via email
* Responsive design
* Secure checkout
* Online payment using Razorpay

### 🔐 Authentication

* JWT-based authentication
* Secure user sessions
* Login & registration
* Forgot password
* Reset password
* Email-based password recovery using Resend

### 👨‍💼 Admin Panel

* Admin dashboard
* Product management
* Add, update and delete products
* Manage product information
* Manage users and orders

### 💳 Payment Integration

Seloria uses **Razorpay** for secure online payments.

* Razorpay Checkout
* Payment verification
* Secure transaction flow
* Production payment integration

### 📧 Email Services

**Resend** is used for transactional emails, including password-reset emails.

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* JavaScript / TypeScript
* Tailwind CSS
* HTML5
* CSS3

### Backend

* Next.js API Routes
* Node.js
* REST APIs
* JWT Authentication

### Database

* MongoDB
* Mongoose

### Services & Tools

* Razorpay
* Resend
* Git
* GitHub
* Vercel
* VS Code

---

## 📂 Project Structure

```text
seloria/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
├── .env.local
├── package.json
├── next.config.js
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
```

### 2. Navigate to the project

```bash
cd seloria
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=

JWT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

RESEND_API_KEY=
```

Add the required values according to your environment.

### 5. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🚀 Deployment

Seloria is deployed using **Vercel**.

Before deploying, make sure all required environment variables are configured in the production environment.

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

---

## 🔒 Security

The application follows secure practices including:

* Environment variables for sensitive credentials
* JWT-based authentication
* Protected API routes
* Secure password-reset flow
* Payment verification
* Server-side validation

**Never commit `.env.local` or any secret API credentials to GitHub.**

---

## 📸 Screenshots

Add screenshots of the application here.

```text
/screenshots
├── home.png
├── products.png
├── product-details.png
├── cart.png
├── checkout.png
└── admin-dashboard.png
```

---

## 🌐 Live Project

**Website:** https://www.getseloria.com

---

## 👨‍💻 Developer

**Krunal Chaudhari**

Full-Stack Developer

* Portfolio: https://www.krunalchaudhari.dev
* GitHub: https://github.com/
* LinkedIn: [https://www.linkedin.com/](https://www.linkedin.com/in/krunal-chaudhari-2b9ab5354)

---

## ⭐ Support

If you find this project useful or interesting, consider giving the repository a ⭐.

---

### 📄 License

This project is developed for portfolio and educational purposes.

# 🦄 Ventiqo SaaS Platform

Ventiqo is a premium, state-of-the-art, AI-powered SaaS platform designed to help entrepreneurs, startups, and businesses automatically generate investor-ready, comprehensive business plans in minutes. 

Built with the speed of **Laravel 11**, the interactive power of **React 19**, and the fluid single-page experience of **Inertia.js (Vite 6)**, Ventiqo is fully optimized for scale, multilingual support, and a responsive experience from desktop down to mobile viewports.

---

## ✨ Core Features

### 🤖 1. Asynchronous AI Business Plan Generation
* Generates a complete business plan across **9 critical investor sections**:
  * *Executive Summary, Company Presentation, Market Analysis, Organization & Management, Strategy, Operational Plan, Financial Plan, Risks & Opportunities, and Appendices.*
* Seamlessly orchestrated in the background via dedicated **n8n automated workflows** to keep the user interface lightning-fast and responsive.
* Dynamic status tracking allows users to pause, resume, continue, and regenerate custom sections in real-time.

### 🗺️ 2. Business Model Canvas (BMC)
* Beautiful, interactive, and visually standardized Business Model Canvas grid.
* Instantly populated by the AI engine based on the generated company profiles.
* Export capabilities let users download their canvases and business plans directly for pitching.

### 💼 3. Company & Product Portfolio
* Create and manage multiple companies, complete with secure logo uploads.
* Dedicated product catalogue database allowing users to link products, costs, and pricing structures directly to specific company projects.
* **Persistent Storage Mounts** ensure that user-uploaded logos and assets remain permanently preserved across container deployments.

### 🌐 4. Full Bilingual Internationalization (i18n)
* Complete, out-of-the-box translation parity between **English** (`en`) and **French** (`fr`).
* Persistent language toggle located right in the main navigation.
* Dynamic translations integrated deeply into form validation errors, page titles, and tooltips.

### 💳 5. Stripe Billing & Subscription Enforcement
* Multi-tier SaaS model preconfigured for:
  * **Free/Trial Plan**: Basic generation access to experience the platform.
  * **Basic Plan**: Unlocks standard features and higher project quotas.
  * **Unlimited Plan**: Complete access with unrestricted business plan generations.
* Secure checkout redirect flows powered by the official **Stripe API**.
* Automated, secure **Stripe Webhook Listener** to instantly handle purchases, renewals, cancellations, and active subscription updates.

### 🛡️ 6. Powerful Administrative Dashboard
* Comprehensive back-office command center for administrators:
  * **User Management**: Monitor user signups, modify roles (User/Admin), adjust subscription limits, and create/reset accounts.
  * **Plan Telemetry**: View all active business plan pipelines, language metadata, and live section generation progression.
  * **Support Desk**: Direct customer support ticket manager, allowing administrators to filter requests, change ticket statuses, and write rich replies.

### 🎨 7. Premium Design System & Mobile Responsiveness
* Highly responsive layouts meticulously optimized using custom Tailwind utilities.
* **Mobile-First Cards**: Grid-based table views on phone browsers dynamically transition to stunning, touch-optimized card lists (on Companies, Products, Projects, Admin Users, and Admin Business Plans).
* Fluid **Dark/Light Mode** synchronization powered by user preferences and persistent cookie caching to eliminate landing page flashing.

---

## 🛠️ Technology Stack

* **Backend**: Laravel 11 (PHP 8.2+), Eloquent ORM, Strict-Mode Safe Queries.
* **Frontend**: React 19, TypeScript, Inertia.js, Vite 6, Tailwind CSS.
* **Design Core**: Shadcn/ui, Lucide Icons, Plus Jakarta Sans & Outfit Fonts.
* **Orchestration**: n8n workflows, cURL Webhooks, Logging Telemetry.
* **Database**: MySQL / MariaDB (fully optimized for strict GROUP BY sorting).

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
* PHP 8.2 or higher
* Composer
* Node.js (v18+) & npm
* XAMPP / Local MySQL server

### 2. Local Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Ventiqo
   ```

2. **Install Composer dependencies**:
   ```bash
   composer install
   ```

3. **Install npm packages**:
   ```bash
   npm install
   ```

4. **Set up environment configuration**:
   * Duplicate `.env.example` and save it as `.env`:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` and set up your local Database credentials, Stripe API keys, and your deployed n8n base webhook URL.

5. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

6. **Run Database Migrations & Seeders**:
   ```bash
   php artisan migrate --seed
   ```

7. **Create the Storage Symlink**:
   ```bash
   php artisan storage:link
   ```

8. **Start the development servers**:
   * In terminal 1, run Vite:
     ```bash
     npm run dev
     ```
   * In terminal 2, run Laravel:
     ```bash
     php artisan serve
     ```
   * Open your browser and navigate to: `http://localhost:8000`

---

## 🚢 Production Deployment

Ventiqo is **Docker and Nixpacks ready**, preconfigured for immediate deployment to platforms like **Railway** or **Render**.

### 1. Container Configuration (`nixpacks.toml`)
The repository contains a custom deployment configuration that automatically runs essential database tasks, links assets, and creates required internal folders on production start:
```toml
[start]
cmd = 'mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/app/public storage/logs && php artisan storage:link && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-9000}'
```

### 2. Persistent Storage (Crucial!)
To ensure that user-uploaded company logos and files are permanently preserved across container deployments:
1. In your cloud provider dashboard (e.g., Railway), navigate to your Laravel app settings.
2. Select **Add Volume**.
3. Set the **Mount Path** to exactly: `/app/storage`.
4. Save and deploy. The startup script will instantly map the persistent drive and initialize all required framework sub-folders.

---

## 📄 License
The Ventiqo SaaS Platform is open-sourced software licensed under the **MIT License**.

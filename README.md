# 🎨 Creative Showcase

**A responsive platform designed for artists to upload and showcase their digital memories and artwork in a stunning masonry layout.**

### 🔗 [Live Demo Hosted Link](https://art-showcase-frontend.vercel.app/)


---

## 📖 Project Overview
The **Creative Showcase** is a full-stack web application developed for the **Intern Technical Assessment: Engineering & Data**. It provides a seamless interface for artists to register, manage their digital portfolios, and share their work with the public using a specialized visual layout.

## ✨ Key Features
* **Landing Page:** Displays a random selection of user-uploaded images in a **mosaic/masonry layout**. Includes navigation for Login and SignUp.
* **Secure Authentication:** Dedicated **SignUp** and **Login** pages for user registration and secure access.
* **User Profile (Private):** A private dashboard featuring an **image upload form** and a gallery of the user's personal uploads.
* **User Public Page:** A dynamic, publicly accessible gallery located at `/profile/[username]` displaying that specific artist's work in a mosaic formation.
* **Responsive Design:** Optimized for all screen sizes using modern CSS techniques.

## 🛠️ Technologies Used
* **Frontend:** React (Bonus) / HTML5 / CSS3 / JavaScript 
* **Backend/Auth:** Firebase (Authentication, Firestore, Storage)
* **Layout:** CSS Grid & `react-masonry-css` 
* **Hosting:** Vercel / Netlify 

## 🚀 Installation & Execution
Follow these steps to run the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/creative-showcase.git](https://github.com/your-username/creative-showcase.git)
    cd creative-showcase
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Create a `.env` file in the root directory and add your Firebase configuration:
    ```text
    REACT_APP_FIREBASE_API_KEY=your_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
    ...
    ```

4.  **Run the Application:**
    ```bash
    npm start
    ```
    *The app will open at `http://localhost:3000`.*

## 📁 Project Structure
```text
/src
  /components     # MasonryGrid, Navbar, ProtectedRoute
  /pages          # Landing, Login, SignUp, PrivateProfile, PublicProfile
  /services       # firebaseConfig.js
  /styles         # Masonry.css and Global styles

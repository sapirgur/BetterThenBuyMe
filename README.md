# BetterThanBuyMe -  A Modular Online Store for Gift Cards

BetterThanBuyMe is a modular web application for an online store, built using Node.js, Express, and EJS. The project focuses on maintainability and scalability.

## Features

- **Responsive design using Bootstrap**
- **Special offers section**
- **Social media integration**
- **User Authentication and Sessions**:
  - User registration and login with session management.
  - Session handling using `express-session`.
- **Cart Management**:
  - Adding, updating, and removing items in the shopping cart.
  - Calculating total quantity and total price of items in the cart.
  - Real-time updates for the shopping cart (adding, removing, changing quantity).
- **Checkout Process**:
  - Checkout page displaying the shopping cart.
- **Category and Product Management**:
  - Displaying categories and businesses for each category.
  - Detailed view of a specific business.
- **Search Functionality**:
  - Searching for businesses and items by keywords, category, and geographical location.
- **Reviews and Ratings**:
  - Displaying top reviews and ratings.
- **Database Integration**:
  - Connection to MongoDB database and managing database queries.
- **Security Features**:
  - Using `dotenv` for environment variables and secrets management.
  - CORS management to protect the application.
- **Content Pages**:
  - Content pages such as "About Us," "Terms and Conditions," "Why Give Gifts," and "Contact Us."
- **User Profile**:
  - User profile page displaying personal information and order history.


## Project Structure

BetterThanBuyMe/
├── public/
│ ├── css/
│ │ └── styles.css
│ ├── images/
│ │ └── (image files)
│ └── js/
│ └── scripts.js
├── views/
│ ├── partials/
│ │ ├── header.ejs
│ │ ├── footer.ejs
│ │ ├── navbar.ejs
│ │ ├── sidebar.ejs
│ │ ├── topbar.ejs
│ └── index.ejs
│ └── login.ejs
│ └── registration.ejs
│ └── shop.ejs
│ └── itemDetail.ejs
│ └── CheckOut.ejs
│ └── aboutUs.ejs
│ └── terms.ejs
│ └── whyGiveGifts.ejs
│ └── contactUs.ejs
│ └── profile.ejs
├── node_modules/
│ └── (installed modules)
├── .env
├── .gitattributes
├── .gitignore
├── app.js
├── db.js
├── package.json
├── package-lock.json


## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/BetterThanBuyMe.git
    cd BetterThanBuyMe
    ```

2. Install the dependencies:
    ```sh
    npm install

## Creating the .env File
To set up the environment variables needed for our project, follow these steps:

1. Create a .env file in the root directory of the project.
2. Add the following environment variables to the .env file:
   
   mongoDB_URI=our_mongodb_uri_here
   
   SESSION_SECRET=our_session_secret_here

**Steps:**
1. Navigate to the root directory of the project.
2. Create a new file named .env.
3. Open the .env file in a text editor.
4. Replace the variables values with the actual values.

**Notes:**
Ensure the .env file is listed in your .gitignore file to avoid committing sensitive information to the repository.
Each team member should create their own .env file with the provided values.


## Running the Application

1. Start the server:
    ```sh
    node app.js
    ```

2. Open your web browser and navigate to `http://localhost:3001` to see the application in action.



## Usage

- **Header**:
  - Contains navigation links to Home, Shop, About, and Contact pages.

- **Hero Section**:
  - A welcoming banner with a background image, main headline, subheadline, and call-to-action button.

- **Advanced Search Bar**:
  - Allows users to search products by keywords, category, and geo region.

- **Special Offers**:
  - Highlights special gift card offers for a group of stores using Bootstrap cards.

- **Customer Testimonials**:
  - Displays customer testimonials in a card format.

- **Social Media Section**:
  - Icons linking to Facebook, Instagram, Mail, and Phone number.

- **Footer**:
  - Contains quick links, social media links, and contact information.

- **Login**:
  - Allows users to sign in with their credentials. Displays an error message for invalid credentials.

- **Registration**:
  - Allows new users to create an account by providing personal information, address, and contact details.

- **Shop**:
  - Displays a list of categories. Users can select a category to view businesses within it.

- **Item Detail**:
  - Displays detailed information about a specific business or product, including name, description, and price.

- **Checkout**:
  - Displays the user's shopping cart and allows them to proceed with the purchase.

- **About Us**:
  - Provides information about the company, its mission, and values.

- **Terms and Conditions**:
  - Displays the terms and conditions for using the website.

- **Why Give Gifts**:
  - Explains the benefits and reasons for giving gifts.

- **Contact Us**:
  - Provides a form for users to contact the company for inquiries or support.

- **Profile**:
  - Displays the user's profile information and order history.


## Dependencies

- Node.js: JavaScript runtime.

- Express: Web framework for Node.js.

- EJS: Embedded JavaScript templating.

- MongoDB: NoSQL database.

- Bootstrap: Front-end framework for responsive design.

- dotenv: Module to load environment variables.

- express-session: Middleware for managing sessions.

- cors: Middleware for enabling Cross-Origin Resource Sharing.


## Customization

- **CSS**:
  - Add your custom styles in `public/css/styles.css`.

- **EJS Partials**:
  - Modify the partials in `views/partials/` to change the structure of different sections of the website.

- **JavaScript**:
  - Add your custom JavaScript in `public/js/scripts.js` to enhance interactivity and functionality of the website.

- **Environment Variables**:
  - Configure your environment variables in the `.env` file to manage settings and secrets securely.

- **Routes**:
  - Add or modify routes in `app.js` to handle different endpoints and functionalities in your application.

- **Database Configuration**:
  - Modify `db.js` to change the MongoDB connection settings or to add new database functionalities.

- **Static Files**:
  - Place additional static files (like images, fonts, etc.) in the `public` directory and reference them in your views or styles.

- **Middleware**:
  - Add custom middleware functions in `app.js` to handle specific needs like authentication, logging, or error handling.

- **View Templates**:
  - Create new EJS view templates in the `views` directory for additional pages or components.



## Prerequisites

- Node.js: Ensure you have Node.js installed. You can download it from nodejs.org

- MongoDB: Make sure MongoDB is installed and running. You can download it from mongodb.com.

## Our Facebook Page
 Stay connected with BetterThanBuyMe through our Facebook page!
 Read reviews and testimonials from other customers, and share your own experiences.
 Link to our Facebook Page: https://www.facebook.com/profile.php?id=61562906957794

## Contributing

If you would like to contribute to this project, please follow these steps:

Fork the repository.
Create a new branch for your feature or bugfix.
Make your changes and commit them with a descriptive message.
Push your changes to your forked repository.
Create a pull request to the main repository.

# BetterThanBuyMe

BetterThanBuyMe is a web application for an online store built with Node.js, Express, and EJS. The project is structured in a modular way to ensure maintainability and scalability.

## Features

- Responsive design using Bootstrap
- Advanced search functionality
- Special offers section
- Customer testimonials
- Social media integration

## Project Structure

```
buyme-website/
|-- views/
|   |-- partials/
|   |   |-- header.ejs
|   |   |-- hero.ejs
|   |   |-- searchBar.ejs
|   |   |-- specialOffers.ejs
|   |   |-- testimonials.ejs
|   |   |-- socialIcons.ejs
|   |   |-- footer.ejs
|   |-- index.ejs
|-- public/
|   |-- css/
|   |   |-- styles.css
|-- app.js
|-- package.json
```

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/BetterThanBuyMe.git
    cd BetterThanBuyMe
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

## Running the Application

1. Start the server:
    ```sh
    node app.js
    ```

2. Open your web browser and navigate to `http://localhost:3001` to see the application in action.

## Usage

- **Header**: Contains navigation links to Home, Shop, About, and Contact pages.
- **Hero Section**: A welcoming banner with a background image, main headline, subheadline, and call-to-action button.
- **Advanced Search Bar**: Allows users to search products by keywords, category, max price, and geo region.
- **Special Offers**: Highlights current promotions using Bootstrap cards.
- **Customer Testimonials**: Displays customer testimonials in a card format.
- **Social Media Section**: Icons linking to Facebook, Instagram, WhatsApp, and Twitter.
- **Footer**: Contains quick links, social media links, and contact information.

## Customization

- **CSS**: Add your custom styles in `public/css/styles.css`.
- **EJS Partials**: Modify the partials in `views/partials/` to change the structure of different sections of the website.

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

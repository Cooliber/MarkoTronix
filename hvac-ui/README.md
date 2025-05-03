# HVAC CRM UI

A responsive Progressive Web Application (PWA) for HVAC businesses to manage clients, emails, transcriptions, offers, scheduling, and more.

## Features

- **Dashboard**: View key metrics and quick actions
- **Client Management**: Add, edit, and view client profiles
- **Email & Transcription Handling**: Manage communications and convert audio to text
- **Offer Creation**: Create, edit, and send offers with AI-generated variants
- **Calendar & Kanban**: Schedule and track service appointments
- **Map View**: Visualize equipment locations and service areas
- **Inventory Management**: Track components and suppliers
- **Service Reports**: Generate and send service reports

## Tech Stack

- **Framework**: Next.js
- **UI Components**: Chakra UI
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Authentication**: JWT
- **Maps**: Leaflet
- **Charts**: Chart.js
- **Drag & Drop**: react-beautiful-dnd

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hvac-ui
   ```

2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your API URL and other configuration.

4. Install dependencies:
   ```bash
   yarn install
   ```

5. Run the development server:
   ```bash
   yarn dev
   ```

6. Build for production:
   ```bash
   yarn build
   ```

7. Start the production server:
   ```bash
   yarn start
   ```

## PWA Features

This application is a Progressive Web App (PWA) that can be installed on desktop and mobile devices. It provides:

- Offline functionality
- Home screen installation
- Fast loading times
- Responsive design for all device sizes

## Mobile Support

The UI is fully responsive and optimized for mobile devices. Key features include:

- Touch-friendly interface
- Mobile-optimized views
- Push notifications
- Offline data access

## Documentation

For more detailed information, please refer to the user documentation in the `/docs` directory.

## License

This project is proprietary and confidential.
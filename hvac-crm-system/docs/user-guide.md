# HVAC CRM System User Guide

This guide provides instructions for using the HVAC CRM system, including both the web interface and mobile application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Client Management](#client-management)
4. [Email & Transcription Handling](#email--transcription-handling)
5. [Offer Management](#offer-management)
6. [Calendar & Scheduling](#calendar--scheduling)
7. [Kanban Board](#kanban-board)
8. [Map View](#map-view)
9. [Inventory Management](#inventory-management)
10. [Service Reports](#service-reports)
11. [Mobile App](#mobile-app)
12. [Telegram Bot](#telegram-bot)
13. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the System

1. Open your web browser and navigate to the system URL provided by your administrator.
2. Enter your username and password on the login screen.
3. If this is your first login, you may be prompted to change your password.

### Installing the Mobile App

The HVAC CRM system is a Progressive Web App (PWA) that can be installed on your mobile device:

1. Open the system URL in your mobile browser (Chrome, Safari, etc.).
2. For iOS:
   - Tap the Share button.
   - Scroll down and tap "Add to Home Screen".
   - Tap "Add" to confirm.
3. For Android:
   - Tap the menu button (three dots).
   - Tap "Add to Home Screen".
   - Tap "Add" to confirm.

### User Roles

The system has three main user roles:

- **Admin**: Full access to all features and settings.
- **Manager**: Access to most features, but limited administrative capabilities.
- **Technician**: Access to service-related features (calendar, reports, etc.).

## Dashboard

The dashboard provides an overview of key metrics and quick access to common actions.

### Key Metrics

- **New Emails**: Number of unread emails.
- **Today's Tasks**: Number of tasks scheduled for today.
- **Offers in Progress**: Number of offers awaiting client response.
- **Revenue**: Current month's revenue.

### Quick Actions

- **New Client**: Create a new client record.
- **New Offer**: Create a new offer.
- **Schedule Service**: Schedule a new service appointment.
- **Generate Report**: Create a new service report.

## Client Management

### Viewing Clients

1. Click on "Clients" in the sidebar menu.
2. Use the search bar to find specific clients.
3. Use filters to narrow down the list (district, status, etc.).
4. Click on a client to view their details.

### Adding a New Client

1. Click on "New Client" on the dashboard or in the Clients section.
2. Fill in the required information:
   - Name
   - Contact information (phone, email)
   - Address
   - Source (how they found you)
   - Notes
3. Click "Save" to create the client record.

### Client Details

The client details page shows:

- Contact information
- Installation details
- Communication history
- Service history
- Offers and contracts

### Adding an Installation

1. Navigate to the client details page.
2. Click on "Add Installation".
3. Fill in the installation details:
   - Equipment type
   - Model
   - Serial number
   - Installation date
   - Location (address and coordinates)
   - Photos
4. Click "Save" to add the installation.

### Sending Client Form Link

1. Navigate to the client details page.
2. Click on "Send Form Link".
3. Choose the form type (installation details, service request, etc.).
4. Select the delivery method (email, SMS).
5. Click "Send" to send the link.

## Email & Transcription Handling

### Email Inbox

1. Click on "Emails" in the sidebar menu.
2. View emails categorized by type (client inquiry, spam, etc.).
3. Click on an email to view its details.

### Email Details

The email details page shows:

- Sender information
- Subject and content
- Attachments
- Related client (if any)
- Response suggestions

### Responding to Emails

1. Click on "Reply" in the email details.
2. Review and edit the suggested response.
3. Click "Send" to send the response.

### Transcriptions

1. Click on "Transcriptions" in the sidebar menu.
2. View a list of audio transcriptions.
3. Click on a transcription to view its details.

### Adding a New Transcription

1. Click on "New Transcription".
2. Upload an audio file or record directly.
3. The system will automatically transcribe the audio.
4. Review and edit the transcription if needed.
5. Click "Save" to store the transcription.

## Offer Management

### Viewing Offers

1. Click on "Offers" in the sidebar menu.
2. Use filters to narrow down the list (status, date, etc.).
3. Click on an offer to view its details.

### Creating a New Offer

1. Click on "New Offer" on the dashboard or in the Offers section.
2. Select the client or create a new one.
3. Choose the source (transcription, form, manual).
4. If using a source, the system will pre-fill information.
5. Review and edit the offer details.
6. Click "Generate Packages" to create offer variants.
7. Review and customize the generated packages.
8. Click "Save" to store the offer.

### Editing Offer Prices

1. Navigate to the offer details page.
2. Click on "Edit Prices".
3. Adjust the prices for components and services.
4. Click "Save" to update the offer.

### Sending an Offer

1. Navigate to the offer details page.
2. Click on "Send Offer".
3. Choose the delivery method (email, link, etc.).
4. Add a personalized message if needed.
5. Click "Send" to deliver the offer.

### Tracking Offer Interactions

1. Navigate to the offer details page.
2. View the "Tracking" section to see:
   - When the client viewed the offer
   - Which sections they spent time on
   - Any clicks or interactions
   - Status updates

## Calendar & Scheduling

### Calendar View

1. Click on "Calendar" in the sidebar menu.
2. View appointments by day, week, or month.
3. Filter by appointment type (inspection, installation, service).
4. Click on an appointment to view its details.

### Scheduling an Appointment

1. Click on "Schedule Service" on the dashboard or in the Calendar section.
2. Select the client and installation.
3. Choose the appointment type.
4. Select the date and time.
5. Assign a technician.
6. Add notes or special instructions.
7. Click "Save" to schedule the appointment.

### Optimizing Routes

1. In the Calendar view, click on "Optimize Routes".
2. Select the date and technician.
3. The system will suggest an optimal route based on appointment locations.
4. Review and adjust if needed.
5. Click "Apply" to update the schedule.

## Kanban Board

### Viewing the Kanban Board

1. Click on "Kanban" in the sidebar menu.
2. View tasks organized by status (To Do, In Progress, Done, etc.).
3. Click on a task to view its details.

### Adding a Task

1. Click on "Add Task" in the Kanban section.
2. Fill in the task details:
   - Title
   - Description
   - Assignee
   - Due date
   - Priority
   - Related client or installation
3. Click "Save" to create the task.

### Moving Tasks

1. Drag and drop tasks between status columns.
2. The system will automatically update the task status.
3. For certain status changes, additional information may be required.

## Map View

### Viewing the Map

1. Click on "Map" in the sidebar menu.
2. View installations and service locations on the map.
3. Use filters to show specific types of equipment or service status.
4. Click on a marker to view details.

### Heat Map

1. In the Map view, click on "Heat Map".
2. View areas with high concentrations of installations or service calls.
3. Use filters to analyze different metrics.

## Inventory Management

### Viewing Inventory

1. Click on "Inventory" in the sidebar menu.
2. View a list of components organized by category.
3. Use filters to narrow down the list.
4. Click on a component to view its details.

### Adding a Component

1. Click on "Add Component" in the Inventory section.
2. Fill in the component details:
   - Name
   - Category
   - Model
   - Supplier
   - Price
   - Quantity
   - Location
3. Click "Save" to add the component.

### Managing Suppliers

1. Click on "Suppliers" in the Inventory section.
2. View a list of suppliers.
3. Click on a supplier to view its details.
4. Add, edit, or remove suppliers as needed.

### Creating an Order

1. Click on "New Order" in the Inventory section.
2. Select the supplier.
3. Add components to the order.
4. Specify quantities and prices.
5. Set the delivery date.
6. Click "Save" to create the order.

## Service Reports

### Viewing Reports

1. Click on "Reports" in the sidebar menu.
2. View a list of service reports.
3. Use filters to narrow down the list.
4. Click on a report to view its details.

### Creating a Service Report

1. Click on "New Report" in the Reports section.
2. Select the client and installation.
3. Fill in the service details:
   - Date and time
   - Technician
   - Service type
   - Work performed
   - Components used
   - Issues found
   - Recommendations
4. Add photos if needed.
5. Collect the client's signature.
6. Click "Save" to create the report.

### Generating a PDF Report

1. Navigate to the report details page.
2. Click on "Generate PDF".
3. The system will create a PDF version of the report.
4. Download or send the PDF as needed.

## Mobile App

### Mobile Dashboard

The mobile dashboard provides quick access to:

- Today's appointments
- New emails
- Tasks assigned to you
- Recent clients

### Mobile Calendar

1. Tap on "Calendar" in the bottom navigation.
2. View your appointments for the day or week.
3. Tap on an appointment to view details.
4. Update appointment status as needed.

### Service Reports on Mobile

1. Tap on "Reports" in the bottom navigation.
2. Create a new report or view existing ones.
3. Use the camera to add photos directly.
4. Collect client signatures on the device.
5. Submit reports even when offline (they will sync when online).

### Offline Functionality

The mobile app works offline with the following capabilities:

- Viewing scheduled appointments
- Creating service reports
- Viewing client information
- Taking photos for reports
- Collecting signatures

Data will sync automatically when the device is back online.

## Telegram Bot

### Setting Up the Bot

1. Search for the HVAC CRM bot on Telegram.
2. Start a conversation with the bot.
3. Use the `/connect` command and follow the instructions to link your account.

### Bot Commands

- `/help`: Show available commands
- `/today`: Show today's appointments
- `/emails`: Show unread emails
- `/tasks`: Show pending tasks
- `/client [name]`: Search for a client
- `/notify [message]`: Send a notification to the team

### Receiving Notifications

The bot will send notifications for:

- New emails
- New service requests
- Appointment reminders
- Task assignments
- Offer status changes

## Troubleshooting

### Common Issues

#### Login Problems

- Ensure you're using the correct username and password.
- Check if your account is locked (contact an administrator).
- Clear your browser cache and cookies.

#### Mobile App Issues

- Ensure you have a stable internet connection for initial setup.
- Update to the latest version of the app.
- Clear the app cache in your device settings.

#### Data Synchronization

- If data doesn't appear to be syncing, check your internet connection.
- Try refreshing the page or restarting the app.
- Contact support if the issue persists.

### Getting Help

For additional assistance:

- Click on the "Help" button in the application.
- Contact your system administrator.
- Email support at support@hvac-crm.com.
- Call the support hotline at +1-800-HVAC-CRM.
# WalkDog 🐕

A React Native mobile application for tracking dog walks with GPS, built with Expo and TypeScript.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (install globally: `npm install -g expo-cli`)
- **iOS Simulator** (for macOS) or **Android Emulator**
- **Expo Go** app on your physical device (optional)

## Backend Requirements

This app requires a backend API server running. The backend should provide:

- currently you can clone the following repo: https://github.com/mkc0615/walkDog

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd walk-dog-front
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   EXPO_PUBLIC_API_SERVICE_URL=your_backend_api_url_here
   EXPO_PUBLIC_MAP_TILER_KEY=your_maptiler_api_key_here
   ```

   **Getting a MapTiler API Key:**

   - Sign up for a free account at [MapTiler](https://www.maptiler.com/)
   - Navigate to Account → Keys
   - Create a new key and copy it to your `.env` file

4. **Configure app.json** (if needed)
   The app is already configured with location permissions. If you need to modify:
   - iOS: Edit `ios.infoPlist` in `app.json`
   - Android: Edit `android.permissions` in `app.json`

## Running the App

1. **Start the development server**

   ```bash
   npx expo start
   ```

2. **Run on your device**
   After starting the server, you can:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app
   - **Web**: Press `w` (limited functionality - no maps/GPS)

## Project Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx        # Login screen
│   └── register.tsx     # Registration screen
├── (protected)/         # Protected (authenticated) routes
│   ├── (tabs)/         # Tab navigation screens
│   │   ├── index.tsx   # Home/Dashboard
│   │   ├── walks.tsx   # Walk history list
│   │   └── profile.tsx # User profile
│   ├── startWalk.tsx   # Walk setup screen
│   ├── activeWalk.tsx  # Active walk tracking with GPS
│   ├── walkDetails.tsx # Individual walk details
│   └── addDog.tsx      # Add new dog
├── auth-context.tsx    # Authentication context provider
├── splash.tsx          # Splash screen with animation
└── _layout.tsx         # Root layout with providers
```

## Key Technologies

- **React Native** - Mobile framework
- **Expo** - Development platform and toolchain
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based routing system
- **expo-location** - GPS tracking and location services
- **react-native-maps** - Map visualization
- **MapTiler** - Map tiles and styling
- **JWT** - Token-based authentication

## Location Permissions

The app requests location permissions during login. Required permissions:

- **iOS**: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`
- **Android**: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`

## Environment Variables

| Variable                      | Description               | Required |
| ----------------------------- | ------------------------- | -------- |
| `EXPO_PUBLIC_API_SERVICE_URL` | Backend API base URL      | Yes      |
| `EXPO_PUBLIC_MAP_TILER_KEY`   | MapTiler API key for maps | Yes      |

## Troubleshooting

**Maps not loading:**

- Verify your MapTiler API key is correct
- Check internet connection
- Ensure the key is prefixed with `EXPO_PUBLIC_`

**Location not working:**

- Check location permissions in device settings
- Ensure GPS is enabled on the device
- Verify `expo-location` is properly installed

**Backend connection failed:**

- Verify backend server is running
- Check `EXPO_PUBLIC_API_SERVICE_URL` in `.env`
- For localhost on Android emulator, use `http://10.0.2.2:9010`
- For localhost on iOS simulator, use `http://localhost:9010`

**Authentication issues:**

- Clear app data and reinstall
- Check token expiration on backend
- Verify JWT token format

## Build for Production

**iOS:**

```bash
eas build --platform ios
```

**Android:**

```bash
eas build --platform android
```

_Note: Requires [Expo Application Services (EAS)](https://expo.dev/eas) account_

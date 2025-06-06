# AirGrist - Airtable to Grist Migration Tool

A modern web application that provides a seamless migration path from Airtable to Grist, featuring an intuitive step-by-step wizard interface with celebratory confetti animations! 🎉

Demo: https://imgur.com/a/airgrist-demo-1-min-fDW10Po


![Migration Wizard](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ Features

- **5-Step Migration Wizard**: Intuitive step-by-step interface
- **Token Validation**: Secure API token validation for both services
- **Base & Table Selection**: Visual selection of Airtable bases and tables
- **Organization Management**: Grist organization and workspace selection
- **Real-time Migration**: Live progress tracking during data transfer
- **Celebratory Experience**: Confetti animation on successful completion
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Type-Safe**: Full TypeScript implementation for reliability

## 🏗️ Architecture

### Tech Stack

- **React 18** with TypeScript for type safety and modern development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS** for utility-first styling and consistent design
- **shadcn/ui** for accessible, customizable UI components
- **React Router** for client-side navigation
- **TanStack Query** for server state management and caching
- **Lucide React** for beautiful, consistent iconography

### Project Structure

```
src/
├── components/
│   ├── migration/          # Migration wizard components
│   │   ├── ConnectionStep.tsx
│   │   ├── BaseSelectionStep.tsx
│   │   ├── TableSelectionStep.tsx
│   │   ├── OrganizationSelectionStep.tsx
│   │   └── CompletionStep.tsx
│   └── ui/                 # Reusable UI components
│       ├── confetti.tsx    # Celebration animation
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/
│   ├── airtable.ts        # Airtable API service
│   ├── grist.ts           # Grist API service
│   └── utils.ts           # Utility functions
├── pages/
│   ├── Index.tsx          # Main migration wizard
│   └── NotFound.tsx       # 404 page
├── hooks/
│   ├── use-toast.ts       # Toast notifications
│   └── use-mobile.tsx     # Mobile detection
└── App.tsx                # Main app with routing
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm (or use [nvm](https://github.com/nvm-sh/nvm))
- **Airtable API Token** ([Get yours here](https://airtable.com/create/tokens))
- **Grist API Token** ([Generate from your Grist account](https://docs.getgrist.com/api/))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/AirGrist.git
cd AirGrist

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Create production build
npm run build:dev    # Create development build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality
```

## 🎯 How to Use

### Step 1: Connect Your Accounts
1. Enter your **Airtable API Token**
2. Enter your **Grist API Token**
3. Provide your **Grist URL** (usually `https://docs.getgrist.com`)
4. Click "Validate & Connect"

### Step 2: Select Airtable Base
- Choose which Airtable base you want to migrate from
- The app will load all your accessible bases

### Step 3: Choose Tables
- Select which tables from your base to migrate
- Multiple table selection is supported
- Preview table information before migration

### Step 4: Select Grist Destination
- Choose your Grist organization
- Select the workspace where tables will be created
- New document will be created automatically

### Step 5: Celebrate! 🎉
- Watch the confetti fall as your migration completes
- Open your new Grist document directly
- Start a new migration if needed

## 🔧 API Integration

The app integrates with both Airtable and Grist APIs:

### Airtable Integration
- **Base Discovery**: Fetches all accessible bases
- **Schema Reading**: Reads table structures and field definitions
- **Data Export**: Retrieves all records from selected tables
- **Type Mapping**: Converts Airtable field types to Grist equivalents

### Grist Integration
- **Organization Management**: Lists orgs and workspaces
- **Document Creation**: Creates new documents in selected workspace
- **Table Creation**: Sets up table structures with proper schemas
- **Data Import**: Populates tables with transformed Airtable data

## 🎨 Customization

### Color Scheme
The app uses a Grist-inspired color palette:
- **Teal/Turquoise**: `#4ECDC4`, `#6BBFB8`, `#3BB5AD`
- **Orange Accents**: `#F4A261`, `#E76F51`, `#E9C46A`

### Confetti Animation
The celebration confetti uses the Grist brand colors and includes:
- Smooth falling animation with rotation
- Performance-optimized with `requestAnimationFrame`
- Auto-cleanup after 4 seconds
- 200 pieces for proper celebration effect

## 🐛 Troubleshooting

### Common Issues

**Token Validation Fails**
- Ensure your API tokens are valid and not expired
- Check that tokens have necessary permissions
- Verify Grist URL format is correct

**Tables Not Loading**
- Confirm you have access to the selected Airtable base
- Check that the base contains tables
- Ensure stable internet connection

**Migration Errors**
- Verify Grist workspace permissions
- Check for field type compatibility issues
- Review browser console for detailed error messages

### Development Issues

**Port Already in Use**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Dependencies Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🧪 Development Tools

### React DevTools
To view the completion page with confetti during development:

1. Install [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) browser extension
2. Open the app and Developer Tools (F12)
3. Go to "Components" tab
4. Find the `Index` component
5. Change `currentStep` state from `1` to `5`
6. Enjoy the confetti! 🎊

### Type Definitions
The project includes comprehensive TypeScript definitions for:
- Airtable API responses
- Grist API structures
- Component props and state
- Migration workflow types

## 🔮 Future Enhancements

- [ ] **Backend API**: Full Python/Flask backend for production use
- [ ] **Background Processing**: Celery integration for large migrations
- [ ] **Progress Tracking**: Real-time migration progress with WebSockets
- [ ] **Error Recovery**: Automatic retry mechanisms for failed migrations
- [ ] **Data Validation**: Pre-migration data quality checks
- [ ] **Batch Processing**: Optimize large dataset transfers
- [ ] **Migration History**: Track and manage previous migrations
- [ ] **Field Mapping**: Custom field type mapping interface

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing component structure
- Add proper error handling
- Include descriptive commit messages
- Test your changes thoroughly

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Grist** team for providing an excellent open-source alternative to Airtable
- **Airtable** for their comprehensive API documentation
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for the utility-first CSS framework
- **React** team for the amazing development experience

---

<div align="center">

**Made with ❤️ for the open-source community**

[Report Bug](https://github.com/your-username/AirGrist/issues) · [Request Feature](https://github.com/your-username/AirGrist/issues) · [Documentation](https://github.com/your-username/AirGrist/wiki)

</div>

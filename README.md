# term-clean




`term-clean` is a terminal TUI (Text User Interface) cleanup tool designed specifically for macOS users. It helps you easily manage, analyze, and clean up packages installed by various package managers (brew, npm, pnpm, yarn, pip).

![Main Interface](doc/main.png)
## 🎯 Why Term-Clean?

Term-Clean is built for you if you've ever faced these scenarios:

- **"I have low disk space, but I don't know what's taking up space..."**
  > 📊 Term-Clean visualizes disk usage, helping you instantly spot large, unused packages.

- **"I'm afraid uninstalling `ffmpeg` will break my other tools..."**
  > 🛡️ With recursive dependency analysis and safe uninstall preview, you'll always know the impact before you act.

- **"I followed a tutorial, installed 20 packages, and now I'm afraid to touch them..."**
  > 🔍 Say goodbye to "dependency anxiety". Term-Clean clarifies what each package does and who needs it.

## 🌟 Core Features

- 📦 **Multi-Manager Support**: One-stop management for Homebrew (Formulae & Casks), npm, pnpm, yarn, and pip.
- 🔍 **Smart Scanning & Analysis**: Automatically detects all installed packages and analyzes their disk usage.
- 🌳 **Dependency Tracing**: Built-in recursive dependency tree algorithm clearly shows the reference relationships between packages.
- ⚠️ **Safe Uninstall Preview**: Before executing uninstallation, the system provides a secondary confirmation and displays affected dependencies to prevent accidental deletion of critical system components.
- ⌨️ **Keyboard-First Interaction**: Built with Ink and React, providing a smooth TUI automatic experience.
- 📊 **Real-time Statistics**: Real-time calculation of the total size of selected packages and the disk space that can be freed.
- 🆙 **Auto Update Detection**: Automatically checks for available updates for all packages in the background, with visual indicators.
- 👁️ **Package Monitoring**: Watch specific packages for updates and track their version changes over time.
- ⚡ **One-Click Upgrade**: Upgrade selected packages to their latest versions with a single keystroke.
- 🔤 **Smart Sorting**: Sort packages by name, size, or installation date with visual indicators.
- 🔎 **Real-time Search**: Quickly filter packages with incremental search functionality.
- ✨ **Batch Operations**: Select all, invert selection, and batch monitoring for efficient package management.

![Dashboard](doc/dashboard.png)

## 🚀 Quick Start

### Quick Start

You can run `term-clean` instantly using `npx`:

```bash
npx term-clean
```

Or install it globally:

```bash
npm install -g term-clean
```

### Development Setup

If you want to contribute or run the source code locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/daijinhai/TermClean.git
   cd TermClean
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run Options**

   **Option A: Development Mode (Recommended for dev)**
   ```bash
   npm run dev        # Start watch mode in one terminal
   node dist/cli.js   # Run the CLI in another terminal
   ```

   **Option B: Production Build (Recommended for testing)**
   ```bash
   npm run build
   npm start
   ```

   **Option C: Global Link (Recommended for daily use)**
   ```bash
   npm link           # Link package globally
   term-clean         # Run command directly
   ```

### Usage

#### Interactive Mode (TUI)

Run the command directly to enter the interactive interface:

```bash
term-clean
```

Once in the interface, you can use the following shortcuts:

### Navigation & Selection
- `↑/↓`: Move up and down in the package list.
- `Tab` / `Shift+Tab`: Switch between different package manager tabs (brew, npm, pip, etc.).
- `Space`: Check/uncheck packages.
- `Enter`: View detailed information for the highlighted package.

### Package Operations
- `p`: Preview mode - View detailed information about selected packages and uninstall impact analysis.
- `u`: Quick uninstall - Uninstall selected packages with confirmation (skips preview).
- `g`: Upgrade selected packages to their latest versions.
- `w`: Toggle watch status for the highlighted package (monitor for updates).
- `W`: Batch watch - Add all selected packages to the watch list.
- `v`: Toggle update check for the highlighted package.

### Batch Operations
- `a`: Select/deselect all packages in the current view.
- `i`: Invert selection.

### Sorting & Filtering
- `s`: Cycle through sort options (name → size → date).
- `/`: Enter search mode to filter packages by name.
- `Esc` (in search mode): Exit search and clear filter.

### System
- `r`: Refresh scanning results.
- `q`: Exit the application.
- `c` (in preview mode): Confirm and execute uninstallation.

![Scanning Dashboard](doc/dashboard2.png)

### 🎨 Visual Indicators

The interface uses intuitive icons to help you understand package status at a glance:

- **👁️** - Package is being watched for updates
- **🆙** - Update available (shows current version → latest version)
- **▲/▼** - Sort direction indicator (ascending/descending)
- **◉** - Selected package
- **○** - Unselected package

### 🔄 Smart Features

**Automatic Update Detection**: Term-Clean silently checks for package updates in the background. When updates are available, packages are marked with 🆙 and show the version upgrade path (e.g., `1.0.0 → 1.0.1`).

**Package Monitoring**: Add frequently-used packages to your watch list with `w`. Watched packages are highlighted and their update status is tracked across sessions.

**Intelligent Sorting**: Press `s` to cycle through different sorting methods:
- **Name** (A-Z or Z-A)
- **Size** (largest/smallest first)
- **Installation Date** (newest/oldest first)

**Search & Filter**: Press `/` to enter search mode and type to filter packages in real-time. The search is case-insensitive and matches package names.

#### Command Line Mode (CLI)

You can also use traditional command-line arguments:

```bash
# Filter only specific package managers
term-clean -m brew

# Start in debug mode (view detailed logs)
term-clean --debug
```

## 🛠️ Development & Testing

### Prerequisites

- Node.js (v18+ recommended)
- npm / pnpm / yarn

### Testing

The project uses `vitest` for unit testing:

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit
```

## 🏗️ Architecture

The project adopts a layered architecture, ensuring good extensibility and maintainability:

- **Managers (Adapter Layer)**: Unifies query and uninstall interfaces for different package managers (e.g., `BrewPackageManager`, `NpmPackageManager`).
- **Services (Business Logic Layer)**: Handles package scanning (`PackageScannerService`) and cleaning processes (`PackageCleanerService`).
- **Stores (State Management)**: Uses `zustand` to manage global reactive state (e.g., selected packages, list data).
- **Components (UI Layer)**: A React component library built on `ink`, responsible for TUI rendering.

## 📅 Roadmap

### Completed ✅
- [x] Multi-package manager adapter implementation
- [x] Recursive dependency analysis algorithm
- [x] Core TUI interface and keyboard interaction
- [x] Uninstall preview and risk warning
- [x] Automatic update detection for all packages
- [x] Package monitoring and watch list
- [x] One-click package upgrade functionality
- [x] Smart sorting (by name, size, installation date)
- [x] Real-time search and filtering
- [x] Batch operations (select all, invert, batch watch)
- [x] Optimized async loading with silent background updates

### In Progress 🚧
- [ ] Export cleanup logs to file
- [ ] Package usage frequency tracking (smart identification of long-unused packages)
- [ ] Enhanced regex filtering
- [ ] Graphical visualization of dependency trees
- [ ] Configuration file support for persistent settings
- [ ] Plugin system for custom package managers

## 📄 License

This project is open-sourced under the MIT License.

## 🤝 Contribution

Issues and Pull Requests are welcome! If you find this tool useful, please give it a ⭐️.

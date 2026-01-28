# term-clean



`term-clean` is a terminal TUI (Text User Interface) cleanup tool designed specifically for macOS users. It helps you easily manage, analyze, and clean up packages installed by various package managers (brew, npm, pnpm, yarn, pip).

![Main Interface](doc/main.png)
## 🌟 Core Features

- 📦 **Multi-Manager Support**: One-stop management for Homebrew (Formulae & Casks), npm, pnpm, yarn, and pip.
- 🔍 **Smart Scanning & Analysis**: Automatically detects all installed packages and analyzes their disk usage.
- 🌳 **Dependency Tracing**: Built-in recursive dependency tree algorithm clearly shows the reference relationships between packages.
- ⚠️ **Safe Uninstall Preview**: Before executing uninstallation, the system provides a secondary confirmation and displays affected dependencies to prevent accidental deletion of critical system components.
- ⌨️ **Keyboard-First Interaction**: Built with Ink and React, providing a smooth TUI automatic experience.
- 📊 **Real-time Statistics**: Real-time calculation of the total size of selected packages and the disk space that can be freed.

![Dashboard](doc/dashboard.png)

## 🚀 Quick Start

### Installation

You can install it globally via npm:

```bash
npm install -g term-clean
```

*(Note: The code is currently in the development phase. You can clone the repository and run `npm link` for testing)*

### Usage

#### Interactive Mode (TUI)

Run the command directly to enter the interactive interface:

```bash
term-clean
```

Once in the interface, you can use the following shortcuts:

- `↑/↓`: Move up and down in the package list.
- `Tab`: Switch between different package manager tabs (brew, npm, pip, etc.).
- `Space`: Check/uncheck packages to clean.
- `p`: Enter preview mode to view detailed information about selected packages and uninstall impact analysis.
- `c`: In preview mode, press `c` to confirm and execute uninstallation.
- `r`: Refresh scanning results.
- `q` / `Esc`: Exit the application or exit preview mode.

![Scanning Dashboard](doc/dashboard2.png)

#### Command Line Mode (CLI)

You can also use traditional command-line arguments:

```bash
# Filter only specific package managers
term-clean -m brew

# Start in debug mode (view detailed logs)
term-clean --debug
```

## 🛠️ Development & Testing

If you wish to participate in development or run the project locally:

### Prerequisites

- Node.js (v18+ recommended)
- npm / pnpm / yarn

### Local Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev`
4. Build the project: `npm run build`
5. Run the built program: `node dist/cli.js`

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

- [x] Multi-package manager adapter implementation
- [x] Recursive dependency analysis algorithm
- [x] Core TUI interface and keyboard interaction
- [x] Uninstall preview and risk warning
- [ ] Export cleanup logs to file
- [ ] Package usage frequency tracking (smart identification of long-unused packages)
- [ ] Enhanced search and regex filtering
- [ ] Graphical visualization of dependency trees

## 📄 License

This project is open-sourced under the MIT License.

## 🤝 Contribution

Issues and Pull Requests are welcome! If you find this tool useful, please give it a ⭐️.

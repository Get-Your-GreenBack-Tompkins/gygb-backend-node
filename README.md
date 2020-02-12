# GYGB Tompkins: Node.js Backend

## Setup

1. Install Node with _Node Version Manager_:

- macOS, Linux, and WSL: https://github.com/nvm-sh/nvm
- WindowS: https://github.com/coreybutler/nvm-windows

After installing set your Node version to be "v12"

```sh
nvm install v12
nvm use v12
```

2. Install dependencies.

```sh
# Execute *in* the project directory.
npm install
```

## Running Locally

```
# Runs a development server!
npm run dev
```

### Run the linter!

```
npm run lint
```

### Build for production

```
# Build for production
npm run build
# Run for production
npm run serve
```

Project structure derived from Microsoft's [TypeScript Node Starter Pack](https://github.com/microsoft/TypeScript-Node-Starter/).

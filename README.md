# GYGB Tompkins: Node.js Backend

## Setup

1. Install Node with _Node Version Manager_:

    - macOS, Linux, and WSL: https://github.com/nvm-sh/nvm
    - WindowS: https://github.com/coreybutler/nvm-windows

    After installing set your Node version to be "v12"

    > Note: On Windows you may have to be more specific than v12 and use the full latest version string (e.g. v12.18.3)

    ```sh
    nvm install v12
    nvm use v12
    ```

2. Setup GitHub Packages authentication

    Copy `sample.npmrc` to `.npmrc` and replace `<YOUR_AUTH_TOKEN>` with [a GitHub personal access token](https://github.com/settings/tokens), you only need to allow the `read:packages` permission. 

3. Install dependencies.

    ```sh
    # Execute *in* the project directory.
    yarn install
    ```

## Setup Firestore

1. Copy `sample.env` to `.env`.

2. Follow Firebase's instructions on generating a private key file [here](https://firebase.google.com/docs/admin/setup#initialize-sdk).

3. Once you have obtained your key file **do not commit it to the repository**.

4. Format the file so that it is a single line:

    ```json
    {
        "type": "service_account",
        "project_id": "",
        "private_key_id": "",
        "private_key": "",
        "client_email": "",
        "client_id": "",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": ""
    }
    ```

    becomes...

    ```json
    { "type": "service_account", "project_id": "", "private_key_id": "", "private_key": "", "client_email": "", "client_id": "", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "" }
      ```

    ... and replace `FIREBASE_CREDENTIALS` in `.env` with this string.

5. Replace `GOOGLE_CLOUD_PROJECT` and `FIREBASE_PROJECT_ID` with your Firebase project's ID.

    > Note: `GOOGLE_CLOUD_PROJECT` should match `FIREBASE_PROJECT_ID` unless you specifically changed it. And if you did that, you should know what it was changed to.

## Running Locally

```
# Runs a development server!
yarn dev
```

### Run the linter!

```
yarn lint
```

### Run the test suite!

Run the full test suite with coverage:

```sh
yarn test
```

Run the test suite without coverage:

```sh
yarn test:nocov
```

Run the test suite without the verbose flag set:

```sh
yarn test:quiet
```

### Build for production

```
# Build for production
yarn run build
# Run (like) production
yarn run serve
```

Project structure derived from Microsoft's [TypeScript Node Starter Pack](https://github.com/microsoft/TypeScript-Node-Starter/).

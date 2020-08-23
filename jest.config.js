module.exports = {
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json"
        }
    },
    moduleFileExtensions: [
        "ts",
        "js"
    ],
    modulePathIgnorePatterns: ["<rootDir>/dist/"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    testMatch: [
        "**/*.spec.(ts|js)"
    ],
    testEnvironment: "node"
};
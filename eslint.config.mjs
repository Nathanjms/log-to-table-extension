import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: ["**/*.ts"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": "error",
        curly: "error",
        eqeqeq: "error",
        "no-throw-literal": "error",
        semi: "error",
    },
}, {
    files: ["media/**/*.js"],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: "script",
        globals: {
            acquireVsCodeApi: "readonly",
            Alpine: "readonly",
            document: "readonly",
            navigator: "readonly",
            window: "readonly",
        },
    },
    rules: {
        curly: "error",
        eqeqeq: "error",
        "no-undef": "error",
        "no-unused-vars": "error",
        semi: "error",
    },
}];

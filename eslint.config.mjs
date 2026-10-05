import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const architectureImportRestrictions = [
  {
    group: ["apps/**", "**/apps/**"],
    message:
      "Applications are deployment boundaries and must not import another app."
  },
  {
    group: ["@thigo/*/*"],
    message: "Import a shared package through its declared public export."
  }
];

const apiBoundaryRestrictions = [
  ...architectureImportRestrictions,
  {
    group: ["**/admin-web/**", "**/mobile/**"],
    message: "The API must not import a frontend application."
  }
];

const frontendApiRestrictions = [
  ...architectureImportRestrictions,
  {
    group: ["**/api/**", "@thigo/api", "@thigo/api/**"],
    message:
      "Frontends communicate with the API over its public network contract."
  }
];

const databaseAccessRestrictions = [
  {
    group: ["typeorm", "typeorm/**", "@nestjs/typeorm", "@nestjs/typeorm/**"],
    message:
      "Database access belongs in repositories; controllers and services must not use TypeORM directly."
  }
];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.expo/**",
      "**/coverage/**",
      ".ai/crew/.venv/**",
      ".ai/reports/**"
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-restricted-imports": [
        "error",
        { patterns: architectureImportRestrictions }
      ]
    }
  },
  {
    files: ["apps/api/**/*.ts"],
    rules: {
      // Nest dependency injection relies on runtime imports for reflected constructor types.
      "@typescript-eslint/consistent-type-imports": "off",
      "no-restricted-imports": ["error", { patterns: apiBoundaryRestrictions }]
    }
  },
  {
    files: [
      "apps/api/src/{common,controllers,dto,gateways,guards,middleware,services}/**/*.ts"
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [...apiBoundaryRestrictions, ...databaseAccessRestrictions]
        }
      ]
    }
  },
  {
    files: ["apps/api/src/controllers/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...apiBoundaryRestrictions,
            ...databaseAccessRestrictions,
            {
              group: ["**/repositories/**"],
              message:
                "Controllers must delegate to services, never repositories."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["apps/admin-web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...frontendApiRestrictions,
            {
              group: [
                "**/mobile/**",
                "**/customer/**",
                "**/merchant/**",
                "**/driver/**"
              ],
              message: "Admin Web must not import a mobile application."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["apps/mobile/customer/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...frontendApiRestrictions,
            {
              group: ["**/merchant/**", "**/driver/**", "**/admin-web/**"],
              message: "Customer must not import another frontend application."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["apps/mobile/merchant/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...frontendApiRestrictions,
            {
              group: ["**/customer/**", "**/driver/**", "**/admin-web/**"],
              message: "Merchant must not import another frontend application."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["apps/mobile/driver/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...frontendApiRestrictions,
            {
              group: ["**/customer/**", "**/merchant/**", "**/admin-web/**"],
              message: "Driver must not import another frontend application."
            }
          ]
        }
      ]
    }
  }
);

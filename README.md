# Habit Builder

A static Habit Builder website with a landing page, a demo sign-in/registration screen, and an interactive habit dashboard.

## Project structure

```text
.
├── index.html
├── register.html
├── dashboard.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── .vscode/
```

The HTML pages stay at the repository root so GitHub Pages can use `index.html` as its entry point. Stylesheets, JavaScript, and images are grouped under `assets/`.

## Run locally

Open `index.html` in a browser, or use the VS Code Live Server extension. The sign-in and registration forms are demo-only and direct to the dashboard.

## Publish with GitHub Pages

1. Push this repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Select **Deploy from a branch**, choose the branch to publish and the `/ (root)` folder, then save.
4. Open the Pages URL shown in the repository settings.

The project uses external Google Fonts and Font Awesome resources, so those features require an internet connection.

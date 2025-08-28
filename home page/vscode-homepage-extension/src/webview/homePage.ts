import * as vscode from 'vscode';

export function createHomePage() {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="styles.css">
        <title>Home Page</title>
    </head>
    <body>
        <header>
            <h1>Welcome to the Home Page</h1>
            <nav>
                <ul>
                    <li><a href="#" id="link1">Link 1</a></li>
                    <li><a href="#" id="link2">Link 2</a></li>
                </ul>
            </nav>
        </header>
        <main>
            <section id="content">
                <p>This is the main content area.</p>
            </section>
        </main>
        <footer>
            <p>&copy; 2023 Your Company</p>
        </footer>
        <script>
            document.getElementById('link1').addEventListener('click', () => {
                // Handle link 1 click
                vscode.postMessage({ command: 'link1Clicked' });
            });
            document.getElementById('link2').addEventListener('click', () => {
                // Handle link 2 click
                vscode.postMessage({ command: 'link2Clicked' });
            });
        </script>
    </body>
    </html>
    `;

    return htmlContent;
}
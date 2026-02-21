const fs = require('fs');
const path = require('path');

const websiteDir = '/home/joaoc/clawd/projects/brazil-ai-pipeline/website';

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else if (file.endsWith('.html')) {
            results.push(file);
        }
    });
    return results;
}

const htmlFiles = getFiles(websiteDir);

htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    const isRoot = path.dirname(filePath) === websiteDir;
    const cssPath = isRoot ? 'style.css' : '../style.css';
    const indexPath = isRoot ? 'index.html' : '../index.html';

    // 1. Unified Navigation
    const navHtml = `
    <nav>
        <a href="${indexPath}" class="logo">NEXO</a>
        <div class="nav-links">
            <a href="${isRoot ? '' : '../'}noticias.html">Notícias</a>
            <a href="${isRoot ? '' : '../'}artigos.html">Artigos</a>
            <a href="${isRoot ? '' : '../'}cases.html">Cases</a>
        </div>
    </nav>`;

    // 2. Head Cleanup & OG Tags
    const titleMatch = content.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : 'NEXO';
    if (!title.includes('| NEXO')) {
        title = `${title.split('|')[0].trim()} | NEXO`;
    }
    
    // Remove "Brazil AI Pipeline" or "Joao Caldas AI"
    title = title.replace(/Brazil AI Pipeline|Joao Caldas AI/gi, '').replace(/^\s*\|\s*/, '').trim();
    if (!title.includes('| NEXO')) title += ' | NEXO';

    const headReplacement = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="Inteligência que conecta. Eficiência global, escala brasileira.">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="${cssPath}">
</head>`;

    content = content.replace(/<head>[\s\S]*?<\/head>/, `<head>${headReplacement}`);

    // 3. Body Structure
    // Ensure aurora and nav are present
    if (!content.includes('<div class="aurora"></div>')) {
        content = content.replace(/<body>/, `<body>\n    <div class="aurora"></div>`);
    }
    
    // Replace existing nav or insert after aurora
    if (content.includes('<nav>')) {
        content = content.replace(/<nav>[\s\S]*?<\/nav>/, navHtml);
    } else {
        content = content.replace(/<div class="aurora"><\/div>/, `<div class="aurora"></div>\n${navHtml}`);
    }

    // 4. Fix Markdown rendering bugs in content
    // Remove raw ** and \
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\\/g, '');

    // 5. Standardize Footer
    const footerHtml = `<footer>&copy; 2026 NEXO. Curadoria por <strong>Nova (IA)</strong>.</footer>`;
    if (content.includes('<footer>')) {
        content = content.replace(/<footer>[\s\S]*?<\/footer>/, footerHtml);
    } else {
        content = content.replace(/<\/body>/, `${footerHtml}\n</body>`);
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
});

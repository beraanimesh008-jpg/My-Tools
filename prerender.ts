import fs from "fs";
import path from "path";
import { SEO_CONFIG } from "./src/utils/seoData";
import { BLOG_POSTS } from "./src/utils/blogData";
import { preInjectSeo } from "./src/utils/preInjectSeo";

const distPath = path.join(process.cwd(), "dist");
const indexPath = path.join(distPath, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("Prerender Error: dist/index.html not found! Run 'npm run build' first.");
  process.exit(1);
}

const rawHtml = fs.readFileSync(indexPath, "utf8");

// Get all paths to prerender
const paths = Object.keys(SEO_CONFIG); // e.g. ["/", "/merge-pdf", ...]

// Add blog index page
if (!paths.includes("/blog")) {
  paths.push("/blog");
}

// Add all blog post slugs
Object.keys(BLOG_POSTS).forEach(slug => {
  paths.push(`/blog/${slug}`);
});

console.log(`Starting static SEO prerendering for ${paths.length} routes...`);

paths.forEach(urlPath => {
  try {
    const parsedHtml = preInjectSeo(rawHtml, urlPath);
    
    if (urlPath === "/") {
      // Overwrite the root dist/index.html with the home pre-rendered SEO
      fs.writeFileSync(indexPath, parsedHtml, "utf8");
      console.log("Prerendered: / -> dist/index.html");
    } else {
      // Create subfolder and write index.html inside it
      // Ensure we normalize leading slash/trailing slash
      const folderPath = path.join(distPath, urlPath.replace(/^\//, ""));
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      fs.writeFileSync(path.join(folderPath, "index.html"), parsedHtml, "utf8");
      console.log(`Prerendered: ${urlPath} -> dist/${urlPath.replace(/^\//, "")}/index.html`);
    }
  } catch (err) {
    console.error(`Error prerendering path ${urlPath}:`, err);
  }
});

console.log("Static SEO prerendering completed successfully!");

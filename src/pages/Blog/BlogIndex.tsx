import { useState } from 'react';
import { BLOG_POSTS, BlogPost } from '../../utils/blogData';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Search, Calendar, User, Clock, ArrowRight, ArrowUpRight, Grid, LayoutGrid, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function BlogIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const posts = Object.values(BLOG_POSTS);

  // Derive categories
  const categories = ["all", ...Array.from(new Set(posts.map(p => p.category.toLowerCase())))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "all" || post.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      <SEO 
        title="MyLovesPDF Blog - Expert Productivity & Document Guides"
        description="Explore detailed operating checklists, optimization guides, format conversions tricks, and AI tutorials written by our document engineering team."
        path="/blog"
      />

      <main className="flex-1 py-16">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Magazine Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-100/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-extrabold uppercase tracking-widest rounded-full border border-rose-200/40 dark:border-rose-900/40 mb-5">
              <BookOpen className="w-3.5 h-3.5" /> Educational Knowledge Base
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              The loves <span className="text-rose-600">PDF Blog</span>
            </h1>
            <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400 font-medium">
              Actionable guides, speed checklists, and developer-grade summaries to help you optimize documents and simplify image assets cleanly.
            </p>
          </div>

          {/* Search & Categories Bar */}
          <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/60 shadow-sm">
            {/* Filter tags */}
            <div className="flex flex-wrap gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border ${
                    selectedCategory === cat
                      ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200/30 dark:shadow-none"
                      : "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800/80 hover:border-rose-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Keyword Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>

          {/* Main Blogs Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {filteredPosts.map((post, idx) => (
                <article
                  key={post.slug}
                  className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300"
                >
                  <div className="space-y-4">
                    {/* Thumbnail */}
                    <div className="h-48 w-full rounded-2xl overflow-hidden relative group">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                        {post.category}
                      </div>
                    </div>

                    {/* Metadata Header */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-snug hover:text-rose-600 transition-colors">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-sm text-slate-400 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                        {post.description}
                      </p>
                    </div>
                  </div>

                  {/* Related Tools Interlink Block */}
                  <div className="border-t border-slate-50 dark:border-slate-700/40 pt-4 mt-6">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-black text-rose-600 dark:text-rose-400 hover:gap-2 transition-all"
                    >
                      Read Article <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-805 rounded-[2.5rem] border border-slate-100 dark:border-slate-850">
              <span className="text-5xl">📝</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-4">No Articles Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Try checking other keywords or matching categories!</p>
            </div>
          )}

          {/* Sibling Interlinking Hub */}
          <div className="mt-20 p-10 bg-slate-900 rounded-[3rem] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-2">Need to Process PDF Documents Now?</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 font-medium">Access our local compilers to compress, merge, protect, or split pages inside your browser sandbox.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/merge-pdf" className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl hover:scale-105 transition-all">Merge PDF</Link>
                <Link to="/compress-pdf" className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm rounded-xl border border-slate-700 hover:scale-105 transition-all">Compress PDF</Link>
                <Link to="/background-remover" className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm rounded-xl border border-slate-700 hover:scale-105 transition-all">AI Backdrop Cleaner</Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

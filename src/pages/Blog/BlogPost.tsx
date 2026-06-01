import { useParams, Link } from 'react-router-dom';
import { BLOG_POSTS } from '../../utils/blogData';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Calendar, User, Clock, ArrowLeft, ArrowUpRight, Share2, Facebook, Twitter, Bookmark } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS[slug || ""];

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 justify-between">
        <Navbar />
        <div className="text-center py-24 px-4">
          <span className="text-5xl">🥺</span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-4">Article Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">The requested blog path does not exist on this server.</p>
          <Link to="/blog" className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition">
            Back to Blog Index
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />
      
      {/* Target SEO head injection with breadcrumbs & JSON-LD */}
      <SEO 
        title={`${post.title} | My Loves PDF`}
        description={post.description}
        path={`/blog/${post.slug}`}
      />

      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4">
          
          {/* Breadcrumbs for Articles */}
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <Link to="/" className="hover:text-rose-600 dark:hover:text-rose-400">Home</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link to="/blog" className="hover:text-rose-600 dark:hover:text-rose-400">Blog</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-600 dark:text-slate-300 pointer-events-none truncate max-w-[240px]" title={post.title}>
              {post.title}
            </span>
          </nav>

          {/* Sibling blog back button */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 uppercase tracking-widest mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blogs
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Content column */}
            <div className="lg:col-span-2 space-y-8 bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/60 shadow-sm">
              <div>
                {/* Category Pin */}
                <span className="inline-block px-3 py-1 bg-rose-100/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-extrabold uppercase tracking-widest rounded-lg border border-rose-200/40 dark:border-rose-900/40 mb-4">
                  {post.category}
                </span>
                
                {/* Long H1 Title */}
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-snug mb-6">
                  {post.title}
                </h1>

                {/* Author and Metadata blocks */}
                <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 border-y border-slate-100 dark:border-slate-700/40 py-4">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-rose-500" /> {post.author}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-rose-500" /> {post.date}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-rose-500" /> {post.readTime}</div>
                </div>
              </div>

              {/* Cover Banner */}
              <div className="h-64 sm:h-96 w-full rounded-2xl overflow-hidden shadow-inner">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Rich Body Content */}
              <div 
                className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-medium leading-relaxed space-y-6
                  prose-headings:text-slate-950 dark:prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-8 prose-headings:mb-3
                  prose-h2:text-2xl prose-h3:text-lg
                  prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-4
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-4
                  prose-li:marker:text-rose-500
                  prose-a:text-rose-600 dark:prose-a:text-rose-450 prose-a:font-bold hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Article Share Module */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Bookmark className="w-4 h-4 fill-slate-300" /> Share This Article
                </span>
                <div className="flex gap-2">
                  <button className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-rose-600 transition-colors" title="Facebook Share">
                    <Facebook className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-rose-600 transition-colors" title="Twitter Share">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Article link copied successfully!");
                  }} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 hover:text-rose-600 transition-colors" title="Copy URL">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Sidebar Sibling utilities links */}
            <div className="space-y-8">
              {/* Sibling Related Tool Card widget */}
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/15 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="relative z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 block mb-2">Connected Utility</span>
                  <h3 className="text-xl font-black mb-1 leading-snug">Run Conversions Locally</h3>
                  <p className="text-slate-400 text-xs mb-8 leading-relaxed font-semibold">Avoid slow network queues by compiling PDF structures inside your browser sandbox.</p>
                  
                  <div className="space-y-3.5">
                    {post.relatedTools.map((tool, idx) => (
                      <Link
                        key={idx}
                        to={tool.href}
                        className="flex items-center justify-between w-full p-4.5 bg-slate-800 hover:bg-rose-600 rounded-2xl font-bold text-sm tracking-wide transition-all hover:translate-x-1.5"
                      >
                        {tool.name} <ArrowUpRight className="w-4 h-4 text-white" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Professional Blog Newsletter panel */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700/60 text-left">
                <h4 className="text-base font-black text-slate-900 dark:text-white mb-2 leading-none uppercase tracking-wide">Document Newsletter</h4>
                <p className="text-slate-400 dark:text-slate-550 text-xs font-semibold leading-relaxed mb-6">Receive expert technical updates, Core Web Vitials speed checklists, and format guidelines once a month.</p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for subscribing to our professional document series!");
                }} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter email address..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none transition-all"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

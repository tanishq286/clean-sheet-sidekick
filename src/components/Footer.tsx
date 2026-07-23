export default function Footer() {
  return (
    <footer className="max-w-[660px] mx-auto px-6 py-8 mt-16">
      <div className="timeline-meta">
        © {new Date().getFullYear()} All rights reserved.
      </div>
    </footer>
  );
}

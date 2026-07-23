import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * StyleGuide Component
 * Documents the actual design system used on the homepage:
 * - Rubik font with bold/medium/regular weights
 * - Animated orange accent color
 * - Stripe-inspired gradient background
 * - 150px left column layout pattern
 */
export default function StyleGuide() {
  const [highlightColor, setHighlightColor] = useState("#FF6B35");

  // Monitor the animated --highlightColor CSS variable
  useEffect(() => {
    const interval = setInterval(() => {
      const color = getComputedStyle(document.body).getPropertyValue("--highlightColor");
      if (color) setHighlightColor(color.trim());
    }, 240);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-8 md:px-12 py-16">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-orange hover:opacity-70 transition-opacity mb-12 font-['Rubik']"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Rubik']">Resume Design System</h1>
          <p className="text-lg text-foreground font-['Rubik'] leading-relaxed max-w-3xl">
            Modern resume design system featuring Rubik typography, animated gradient background,
            and orange accent colors. Bold display text creates strong hierarchy while grid-based
            layouts ensure consistent structure.
          </p>
        </div>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-2xl font-medium">
            Typography
          </h2>

          <div className="space-y-12">
            {/* Hero Display */}
            <div>
              <h3 className="font-['Rubik'] font-medium mb-4 text-lg">Hero Display Text</h3>
              <div className="mb-4">
                <div className="text-[clamp(2rem,8vw,4rem)] font-bold leading-none tracking-tighter uppercase font-['Rubik']">
                  CHARLES WILLIAMS
                </div>
              </div>
              <div className="font-['Rubik'] text-sm space-y-1 text-muted">
                <p>Font: Rubik Bold (700)</p>
                <p>Size: clamp(3rem, 12vw, 8rem)</p>
                <p>Style: Uppercase, tight tracking</p>
                <p>Usage: Name, job title in hero section</p>
              </div>
            </div>

            {/* Bio Text */}
            <div>
              <h3 className="font-['Rubik'] font-medium mb-4 text-lg">Bio Text</h3>
              <div className="mb-4">
                <p className="text-xl md:text-2xl leading-tight font-['Rubik']">
                  I'm a design leader with over 10 years of experience crafting intuitive digital experiences.
                </p>
              </div>
              <div className="font-['Rubik'] text-sm space-y-1 text-muted">
                <p>Font: Rubik Regular (400)</p>
                <p>Size: text-2xl (mobile) / text-4xl (desktop)</p>
                <p>Leading: Tight (1.25)</p>
                <p>Usage: Bio paragraph below hero</p>
              </div>
            </div>

            {/* Section Headings */}
            <div>
              <h3 className="font-['Rubik'] font-medium mb-4 text-lg">Section Headings</h3>
              <div className="mb-4">
                <h4 className="text-orange uppercase tracking-wide font-['Rubik'] text-lg font-medium">
                  WORK EXPERIENCE
                </h4>
              </div>
              <div className="font-['Rubik'] text-sm space-y-1 text-muted">
                <p>Font: Rubik Medium (500)</p>
                <p>Size: text-lg (18px)</p>
                <p>Color: Orange (animated --highlightColor)</p>
                <p>Style: Uppercase, wide tracking</p>
                <p>Usage: Main section headings</p>
              </div>
            </div>

            {/* Dates & Labels */}
            <div>
              <h3 className="font-['Rubik'] font-medium mb-4 text-lg">Dates & Labels</h3>
              <div className="mb-4 space-y-2">
                <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                  2021 - PRESENT
                </div>
                <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                  ENGLISH
                </div>
                <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                  DESIGN SKILLS
                </div>
              </div>
              <div className="font-['Rubik'] text-sm space-y-1 text-muted">
                <p>Font: Rubik Medium (500)</p>
                <p>Size: text-base (16px)</p>
                <p>Color: Orange (animated --highlightColor)</p>
                <p>Style: Uppercase</p>
                <p>Usage: Date ranges, language names, skill categories</p>
              </div>
            </div>

            {/* Body Text */}
            <div>
              <h3 className="font-['Rubik'] font-medium mb-4 text-lg">Body Text</h3>
              <div className="mb-4">
                <p className="text-base leading-relaxed font-['Rubik']">
                  Led design for flagship product serving 2M+ active users, achieving 4.8/5 App Store rating.
                  Established company's first design system, reducing design-to-dev handoff time by 60%.
                </p>
              </div>
              <div className="font-['Rubik'] text-sm space-y-1 text-muted">
                <p>Font: Rubik Regular (400)</p>
                <p>Size: text-base (16px) or text-sm (14px)</p>
                <p>Leading: Relaxed (1.625)</p>
                <p>Usage: Job descriptions, education details, skills lists</p>
              </div>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-2xl font-medium">
            Colors
          </h2>

          <div className="space-y-6">
            {/* Animated Orange */}
            <div className="flex items-start gap-6">
              <div
                className="w-24 h-24 border-2 border-black transition-colors duration-300"
                style={{ backgroundColor: highlightColor }}
              ></div>
              <div className="flex-1">
                <h3 className="font-['Rubik'] font-medium text-lg mb-2">Primary Accent (Animated)</h3>
                <p className="font-['Rubik'] text-sm mb-2 text-muted">
                  CSS Variable: <code className="text-orange">--highlightColor</code>
                </p>
                <p className="font-['Rubik'] text-sm mb-2 text-muted">
                  Current: <code className="text-orange">{highlightColor}</code>
                </p>
                <p className="font-['Rubik'] text-sm text-muted">
                  Animates continuously via requestAnimationFrame. Used for dates, labels, section headings,
                  and decorative elements. Updates every 240ms as part of gradient animation.
                </p>
              </div>
            </div>

            {/* Background */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 border-2 border-black bg-gradient-to-br from-orange-50 via-blue-50 to-green-50"></div>
              <div className="flex-1">
                <h3 className="font-['Rubik'] font-medium text-lg mb-2">Animated Gradient Background</h3>
                <p className="font-['Rubik'] text-sm mb-2 text-muted">
                  20-degree linear gradient with three rotating HSL colors
                </p>
                <p className="font-['Rubik'] text-sm text-muted">
                  Stripe-inspired animation creates subtle, dynamic background. Hues rotate continuously
                  using HSL color space with 40% saturation and 96% lightness for soft pastel tones.
                </p>
              </div>
            </div>

            {/* Foreground */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 border-2 border-black bg-foreground"></div>
              <div className="flex-1">
                <h3 className="font-['Rubik'] font-medium text-lg mb-2">Text Color (Animated)</h3>
                <p className="font-['Rubik'] text-sm mb-2 text-muted">
                  CSS Variable: <code className="text-orange">--fontColor</code>
                </p>
                <p className="font-['Rubik'] text-sm text-muted">
                  Dynamically calculated based on gradient hues. Ensures text maintains good contrast
                  with animated background. Uses HSL with 30% saturation and 10% lightness.
                </p>
              </div>
            </div>

            {/* Divider Lines */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 border-2 border-black bg-black"></div>
              <div className="flex-1">
                <h3 className="font-['Rubik'] font-medium text-lg mb-2">Divider Lines</h3>
                <p className="font-['Rubik'] text-sm mb-2 text-muted">
                  Pure black: <code className="text-orange">#000000</code>
                </p>
                <p className="font-['Rubik'] text-sm text-muted">
                  1px solid black lines separate hero section rows. Provides structure and visual rhythm.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Animation */}
        <section className="mb-16">
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-2xl font-medium">
            Animation System
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-['Rubik'] font-medium text-lg mb-4">Stripe-Inspired Background Animation</h3>
              <p className="font-['Rubik'] text-base leading-relaxed mb-4">
                Continuously animating gradient background using requestAnimationFrame. Updates every 240ms
                for smooth, non-jarring transitions. Three HSL hues rotate offset by 120 degrees.
              </p>

              <div className="bg-muted/10 border border-border p-6 font-mono text-sm">
                <pre className="font-['Rubik'] whitespace-pre-wrap">
{`// Animation Loop
const hue1 = (0.5 * counter + 120) % 360;
const hue2 = (0.5 * counter + 240) % 360;
const hue3 = (0.5 * counter + 360) % 360;

// Generate pastel gradient colors
const color1 = \`hsl(\${hue1}deg, 40%, 96%)\`;
const color2 = \`hsl(\${hue2}deg, 40%, 96%)\`;
const color3 = \`hsl(\${hue3}deg, 40%, 96%)\`;

// Apply to background
document.body.style.backgroundImage =
  \`linear-gradient(20deg, \${color1}, \${color2}, \${color3})\`;

// Update CSS variables
const highlightColor = \`hsl(\${hue2}deg, 80%, 70%)\`;
const fontColor = \`hsl(\${hue2}deg, 30%, 10%)\`;

document.body.style.setProperty('--highlightColor', highlightColor);
document.body.style.setProperty('--fontColor', fontColor);`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-['Rubik'] font-medium text-lg mb-2">CSS Variables</h3>
              <ul className="font-['Rubik'] text-base space-y-2">
                <li><code className="text-orange">--highlightColor</code> - Orange accent for dates, labels, headings</li>
                <li><code className="text-orange">--fontColor</code> - Dynamic text color matching gradient</li>
                <li><code className="text-orange">--artForeground</code> - Secondary accent color</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Layout Patterns */}
        <section className="mb-16">
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-2xl font-medium">
            Layout Patterns
          </h2>

          <div className="space-y-12">
            {/* Two-Column Grid */}
            <div>
              <h3 className="font-['Rubik'] font-medium text-lg mb-4">Two-Column Content Grid</h3>
              <p className="font-['Rubik'] text-base mb-4 text-muted">
                <code className="text-orange">grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16</code>
              </p>
              <p className="font-['Rubik'] text-base leading-relaxed mb-6">
                Main content area uses two-column layout on desktop. Left column for work experience,
                right column for education, languages, and skills. Stacks to single column on mobile.
              </p>
            </div>

            {/* Fixed Left Column Pattern */}
            <div>
              <h3 className="font-['Rubik'] font-medium text-lg mb-4">Fixed Left Column Pattern (150px)</h3>
              <p className="font-['Rubik'] text-base mb-4 text-muted">
                <code className="text-orange">grid-cols-[150px_1fr] gap-6</code>
              </p>
              <p className="font-['Rubik'] text-base leading-relaxed mb-6">
                Consistent pattern throughout: 150px fixed left column for dates/labels,
                flexible right column for content. Creates visual alignment and scannability.
              </p>

              {/* Example: Work Experience */}
              <div className="border border-border p-6 mb-6">
                <h4 className="font-['Rubik'] font-medium mb-4">Work Experience Entry</h4>
                <div className="grid grid-cols-[150px_1fr] gap-6">
                  <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                    2021 - PRESENT
                  </div>
                  <div>
                    <div className="italic mb-2 font-['Rubik'] text-base font-medium uppercase">
                      SENIOR PRODUCT DESIGNER, TECH INNOVATORS INC
                    </div>
                    <p className="text-sm leading-relaxed font-['Rubik']">
                      Led design for flagship product serving 2M+ active users, achieving 4.8/5 App Store rating.
                    </p>
                  </div>
                </div>
              </div>

              {/* Example: Education */}
              <div className="border border-border p-6 mb-6">
                <h4 className="font-['Rubik'] font-medium mb-4">Education Entry</h4>
                <div className="grid grid-cols-[150px_1fr] gap-6">
                  <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                    2011 - 2015
                  </div>
                  <div className="font-['Rubik'] text-base">
                    University of California, Berkeley, Bachelor of Arts in Interactive Media Design
                  </div>
                </div>
              </div>

              {/* Example: Skills */}
              <div className="border border-border p-6">
                <h4 className="font-['Rubik'] font-medium mb-4">Skills Entry</h4>
                <div className="grid grid-cols-[150px_1fr] gap-6">
                  <div className="text-orange font-['Rubik'] text-base font-medium uppercase">
                    DESIGN SKILLS
                  </div>
                  <p className="font-['Rubik'] text-base leading-relaxed">
                    Product Design, UX Research, Design Systems, Accessibility, Prototyping, User Testing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Font Loading */}
        <section className="mb-16">
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-2xl font-medium">
            Font System
          </h2>

          <div>
            <h3 className="font-['Rubik'] font-medium text-lg mb-4">Rubik from Google Fonts</h3>
            <p className="font-['Rubik'] text-base leading-relaxed mb-4">
              Single custom font family provides personality and consistency. Three weights cover all use cases:
            </p>
            <ul className="font-['Rubik'] text-base space-y-2 mb-6">
              <li><strong>Regular (400)</strong> - Body text, descriptions, paragraphs</li>
              <li><strong>Medium (500)</strong> - Dates, labels, section subheadings, job titles</li>
              <li><strong>Bold (700)</strong> - Hero names, main headings, emphasis</li>
            </ul>

            <div className="bg-muted/10 border border-border p-6 font-mono text-sm">
              <pre className="font-['Rubik'] whitespace-pre-wrap">
{`<!-- Load from Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap"
      rel="stylesheet" />

/* Apply with Tailwind arbitrary value */
.font-['Rubik']`}
              </pre>
            </div>
          </div>
        </section>

        {/* Design Principles */}
        <section>
          <h2 className="text-orange uppercase tracking-wide mb-8 font-['Rubik'] text-2xl font-medium">
            Design Principles
          </h2>

          <div className="space-y-6 font-['Rubik'] text-base leading-relaxed">
            <div>
              <h3 className="font-medium text-lg mb-2">Bold Typography</h3>
              <p className="text-muted">
                Large display text creates strong visual hierarchy. Responsive scaling using clamp()
                ensures optimal readability across all screen sizes.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Animated Accents</h3>
              <p className="text-muted">
                Orange accent color animates with gradient background, creating dynamic visual interest
                while maintaining professionalism. Stripe-inspired animation is subtle and non-distracting.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Rubik Font System</h3>
              <p className="text-muted">
                Custom font family adds personality and consistency. Three weights (regular, medium, bold)
                cover all typography needs without overwhelming the design.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Grid-Based Layout</h3>
              <p className="text-muted">
                150px fixed left column pattern creates visual rhythm and scannability. Consistent
                structure makes information easy to find and read quickly.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Uppercase Styling</h3>
              <p className="text-muted">
                Dates, titles, and labels use uppercase + medium weight for emphasis. Creates clear
                distinction between labels and content without requiring additional visual weight.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Responsive Scale</h3>
              <p className="text-muted">
                Fluid typography using clamp() provides smooth scaling from mobile to desktop.
                Large text remains impactful on big screens while staying readable on small ones.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-2">Stripe-Inspired Animation</h3>
              <p className="text-muted">
                Subtle animated gradient creates dynamic, modern feel without overwhelming content.
                Updates every 240ms for smooth transitions that don't distract from information.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

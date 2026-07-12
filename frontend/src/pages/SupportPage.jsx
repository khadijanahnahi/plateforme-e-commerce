import { useState } from "react";
import { Link } from "react-router-dom";
import { getSupportApiError, supportApi } from "../api/supportApi";

const quickHelpLinks = [
  "Order Tracking",
  "Cash on Delivery",
  "Shipping & Delivery",
  "Returns & Exchanges",
  "Account Help",
];

const contactDetails = [
  {
    label: "Email Us",
    value: "support@shopsphere.com",
    detail: "For order, delivery and account questions.",
  },
  {
    label: "Call Us",
    value: "+1 (800) 123-4567",
    detail: "Speak with our customer care team.",
  },
  {
    label: "Hours",
    value: "Mon - Fri 9AM - 6PM",
    detail: "Eastern Standard Time.",
  },
];

const supportHighlights = [
  {
    title: "Fast Response",
    text: "Our team responds within 24 hours on business days.",
  },
  {
    title: "Cash on Delivery Help",
    text: "Get clear guidance about paying safely when your order arrives.",
  },
  {
    title: "Order Tracking",
    text: "Track your order and stay updated every step of the way.",
  },
  {
    title: "Returns & Exchanges",
    text: "Hassle-free returns within 30 days for eligible items.",
  },
];

const faqs = [
  {
    question: "How long does delivery take?",
    answer: "Standard delivery usually takes 2 to 5 business days after your order is confirmed.",
  },
  {
    question: "Can I change or cancel my order?",
    answer: "You can request a change or cancellation while the order is still pending. Once shipped, changes may not be possible.",
  },
  {
    question: "What is your return policy?",
    answer: "Eligible items can be returned within 30 days if they are unused and in their original condition.",
  },
  {
    question: "How do I track my order?",
    answer: "Log in to your account and open My Orders to view the latest status updates.",
  },
  {
    question: "Do you offer international shipping?",
    answer: "International shipping can be enabled depending on destination and carrier availability.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "For this MVP, ShopSphere uses Cash on Delivery. Online payment can be added later.",
  },
];

export default function SupportPage() {
  const [imageFailed, setImageFailed] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      orderNumber: String(formData.get("orderNumber") ?? "").trim() || null,
      message: String(formData.get("message") ?? "").trim(),
    };

    setSubmitting(true);
    setSubmitted(false);
    setSubmitError("");
    try {
      await supportApi.createMessage(payload);
      setSubmitted(true);
      form.reset();
    } catch (exception) {
      setSubmitError(getSupportApiError(exception));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="support-page">
      <section className="page support-hero-section">
        <div className="support-hero-card">
          <div className="support-hero-copy">
            <span className="section-kicker">Customer Care</span>
            <h1>Support & Contact</h1>
            <p>We're here to help with orders, delivery, returns and account questions.</p>
            <div className="support-hero-actions">
              <a className="button button-primary" href="#support-message">Send a Message</a>
              <Link className="button button-secondary" to="/orders">Track an Order</Link>
            </div>
          </div>

          <div className="support-hero-visual">
            {!imageFailed ? (
              <img
                src="/images/support-hero.webp"
                alt="ShopSphere customer support and order care"
                className="support-hero-image"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="support-hero-placeholder">
                <span>Image preview unavailable</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="page support-main-grid">
        <form id="support-message" className="support-card support-form-card" onSubmit={handleSubmit}>
          <span className="section-kicker">Message</span>
          <h2>Send us a message</h2>
          <div className="support-form-grid">
            <input name="fullName" placeholder="Full Name" required />
            <input name="email" type="email" placeholder="Email" required />
          </div>
          <select name="subject" defaultValue="" required>
            <option value="" disabled>Subject</option>
            <option>Order question</option>
            <option>Shipping & delivery</option>
            <option>Returns & exchanges</option>
            <option>Account help</option>
            <option>Other</option>
          </select>
          <input name="orderNumber" placeholder="Order Number (optional)" />
          <textarea name="message" placeholder="Message" required />
          <button className="button button-primary support-submit" disabled={submitting} type="submit">
            {submitting ? "Envoi en cours..." : "Envoyer la demande"}
          </button>
          {submitted ? <p className="support-success">Message recu. Notre equipe vous contactera rapidement.</p> : null}
          {submitError ? <p className="support-error">{submitError}</p> : null}
          <small>Your information is secure and will only be used to assist you.</small>
        </form>

        <aside className="support-side-stack">
          <div className="support-card">
            <span className="section-kicker">Contact</span>
            <h2>Contact Details</h2>
            <div className="support-contact-list">
              {contactDetails.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="support-card">
            <span className="section-kicker">Quick Help</span>
            <h2>Popular topics</h2>
            <div className="quick-help-list">
              {quickHelpLinks.map((label) => (
                <a href="#support-faq" key={label}>{label}</a>
              ))}
            </div>
          </div>

          <div className="support-card">
            <span className="section-kicker">FAQ Preview</span>
            <h2>Common questions</h2>
            <div className="faq-preview-list">
              {faqs.slice(0, 4).map((faq) => (
                <a href="#support-faq" key={faq.question}>{faq.question}</a>
              ))}
            </div>
            <a className="support-text-link" href="#support-faq">View all FAQs</a>
          </div>
        </aside>
      </section>

      <section className="page support-highlight-grid">
        {supportHighlights.map((item, index) => (
          <article className="support-highlight-card" key={item.title}>
            <span>0{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section id="support-faq" className="page support-faq-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Support FAQ</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <p>Answers to the most common ShopSphere support questions.</p>
        </div>

        <div className="support-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <article className={`support-faq-item ${isOpen ? "support-faq-open" : ""}`} key={faq.question}>
                <button type="button" onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}>
                  <span>{faq.question}</span>
                  <strong>{isOpen ? "-" : "+"}</strong>
                </button>
                {isOpen ? <p>{faq.answer}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="page support-cta-section">
        <div className="support-cta-card">
          <div>
            <span className="section-kicker">Need more help?</span>
            <h2>Still need help?</h2>
            <p>Our support team is ready to assist you.</p>
          </div>
          <div className="support-cta-actions">
            <a className="button button-secondary" href="#support-message">Contact Support</a>
            <a className="button button-primary" href="#support-faq">Browse Help Center</a>
          </div>
        </div>
      </section>

      <footer className="support-footer support-local-footer">
        <div className="page support-footer-grid">
          <div className="support-footer-brand">
            <strong>ShopSphere</strong>
            <p>Premium monochrome essentials for modern everyday style.</p>
          </div>
          <div>
            <h3>Shop</h3>
            <Link to="/products">All Products</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/products?sort=new">New Arrivals</Link>
            <Link to="/products?sort=best">Best Sellers</Link>
          </div>
          <div>
            <h3>Customer Care</h3>
            <Link to="/support">Support</Link>
            <Link to="/orders">Order Tracking</Link>
            <a href="#support-faq">Returns</a>
            <a href="#support-faq">FAQ</a>
          </div>
          <div>
            <h3>About</h3>
            <a href="/#about">Our Story</a>
            <a href="/#contact">Contact</a>
            <Link to="/terms">Conditions</Link>
            <Link to="/privacy-policy">ConfidentialitÃ©</Link>
            <Link to="/return-policy">Retours</Link>
          </div>
          <form className="support-newsletter" onSubmit={(event) => event.preventDefault()}>
            <h3>Newsletter</h3>
            <p>Subscribe for drops, offers and style inspiration.</p>
            <div>
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}

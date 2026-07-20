import Seo from '../components/Seo.jsx';
import { useContent } from '../hooks/useContent.js';
import './ContactPage.css';

export default function ContactPage() {
  const { contact } = useContent();
  const form = contact?.form ?? {};

  // Opens the visitor's mail client pre-filled — no backend required.
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const message = data.get('message') || '';
    const subject = encodeURIComponent(`Project inquiry — ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${contact?.email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Seo title={contact?.seo?.title} description={contact?.seo?.description} path="/contact" />
      <section className="contact">
        <h1 className="page-heading">{contact?.heading || 'Contact'}</h1>
        <p className="contact__details">
          {contact?.location}
          <br />
          {contact?.email}
          <br />
          {contact?.phone}
        </p>
        <form className="contact__form" onSubmit={handleSubmit}>
          <input name="name" type="text" placeholder={form.namePlaceholder || 'Name'} autoComplete="name" required />
          <input name="email" type="email" placeholder={form.emailPlaceholder || 'Email'} autoComplete="email" required />
          <textarea name="message" rows="4" placeholder={form.messagePlaceholder || 'Project details'} required />
          <button type="submit">{form.submitLabel || 'Send'}</button>
        </form>
      </section>
    </>
  );
}

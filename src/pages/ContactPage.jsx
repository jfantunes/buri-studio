import { useState } from 'react';
import Seo from '../components/Seo.jsx';
import { useContent } from '../hooks/useContent.js';
import './ContactPage.css';

export default function ContactPage() {
  const { contact } = useContent();
  const form = contact?.form ?? {};
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    setSubmitted(true);
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
        <form className="contact__form" action="https://api.web3forms.com/submit" method="POST" onSubmit={handleSubmit}>
          <input type="hidden" name="access_key" defaultValue={form.web3formsAccessKey || ''} />
          <input type="hidden" name="subject" defaultValue={form.subject || 'New project inquiry from Buri Studio'} />
          <input type="hidden" name="from_name" defaultValue={form.fromName || 'Buri Studio website'} />
          <input name="name" type="text" placeholder={form.namePlaceholder || 'Name'} autoComplete="name" required />
          <input name="email" type="email" placeholder={form.emailPlaceholder || 'Email'} autoComplete="email" required />
          <textarea name="message" rows="4" placeholder={form.messagePlaceholder || 'Project details'} required />
          <button type="submit">{form.submitLabel || 'Send'}</button>
          {submitted && (
            <p className="contact__thanks" role="status">
              {form.thanksMessage || 'Thanks for contacting Buri Studio. We will get back to you soon.'}
            </p>
          )}
        </form>
      </section>
    </>
  );
}

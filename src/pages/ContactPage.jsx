import { useState } from 'react';
import Seo from '../components/Seo.jsx';
import { useContent } from '../hooks/useContent.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import './ContactPage.css';

export default function ContactPage() {
  const { contact } = useContent();
  const { t } = useLanguage();
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
        <h1 className="page-heading">{contact?.heading || t('nav.contact')}</h1>
        <p className="contact__details">
          {contact?.location}
          <br />
          {contact?.email}
          <br />
          {contact?.phone}
        </p>
        <form className="contact__form" action="https://api.web3forms.com/submit" method="POST" onSubmit={handleSubmit}>
          <input type="hidden" name="access_key" value={form.web3formsAccessKey || ''} readOnly />
          <input type="hidden" name="subject" value={form.subject || t('contact.defaultSubject')} readOnly />
          <input type="hidden" name="from_name" value={form.fromName || t('contact.defaultFromName')} readOnly />
          <input name="name" type="text" placeholder={form.namePlaceholder || t('contact.name')} autoComplete="name" required />
          <input name="email" type="email" placeholder={form.emailPlaceholder || t('contact.email')} autoComplete="email" required />
          <textarea name="message" rows="4" placeholder={form.messagePlaceholder || t('contact.projectDetails')} required />
          <button type="submit">{form.submitLabel || t('contact.send')}</button>
          {submitted && (
            <p className="contact__thanks" role="status">
              {form.thanksMessage || t('contact.defaultThanks')}
            </p>
          )}
        </form>
      </section>
    </>
  );
}

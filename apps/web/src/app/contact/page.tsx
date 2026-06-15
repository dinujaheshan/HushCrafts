'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2, Instagram, Facebook, MessageCircle } from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const contactMethods = [
  {
    icon: <Phone size={20} />,
    label: 'Phone / WhatsApp',
    value: '+94 71 367 0089',
    href: 'https://wa.me/94713670089',
    color: 'text-green-500 bg-green-500/10'
  },
  {
    icon: <Mail size={20} />,
    label: 'Email',
    value: 'hushcrafts26@gmail.com',
    href: 'mailto:hushcrafts26@gmail.com',
    color: 'text-primary bg-primary/10'
  },
  {
    icon: <MapPin size={20} />,
    label: 'Location',
    value: 'Pitakotte, Kotte, Sri Lanka',
    href: 'https://maps.google.com/?q=Pitakotte,Kotte,Sri+Lanka',
    color: 'text-amber-500 bg-amber-500/10'
  },
  {
    icon: <Instagram size={20} />,
    label: 'Instagram',
    value: '@hush_crafts',
    href: 'https://instagram.com/hush_crafts',
    color: 'text-pink-500 bg-pink-500/10'
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all fields.');
      return;
    }
    setSending(true);
    setError('');
    
    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        message: form.message.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSending(false);
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Failed to submit message to Firestore:', err);
      setError('Failed to send message. Please try again later.');
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--primary)/0.15) 0%, transparent 50%)'
        }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
            <MessageCircle size={12} /> Get In Touch
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}>
            We&apos;d Love to <span className="text-primary">Hear</span> From You
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Have a question about sizing, a custom order request, or just want to say hello? We&apos;re here for you!
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-14">
            {/* Contact Methods */}
            <div>
              <h2 className="font-serif text-3xl font-semibold text-foreground mb-3"
                style={{ fontFamily: 'var(--font-serif)' }}>
                Contact Details
              </h2>
              <p className="text-muted-foreground mb-8">
                Reach out via any of the channels below. We usually respond within a few hours on working days.
              </p>

              <div className="space-y-4">
                {contactMethods.map((method) => (
                  <a
                    key={method.label}
                    href={method.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${method.color} transition-colors`}>
                      {method.icon}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{method.label}</p>
                      <p className="text-foreground font-semibold group-hover:text-primary transition-colors">{method.value}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Business Hours */}
              <div className="mt-10 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                <h3 className="font-semibold text-foreground mb-3">Business Hours</h3>
                <ul className="space-y-2 text-sm">
                  {[
                    { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM' },
                    { day: 'Saturday', hours: '10:00 AM – 4:00 PM' },
                    { day: 'Sunday', hours: 'Closed' },
                  ].map(({ day, hours }) => (
                    <li key={day} className="flex justify-between">
                      <span className="text-muted-foreground">{day}</span>
                      <span className="text-foreground font-medium">{hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-2"
                  style={{ fontFamily: 'var(--font-serif)' }}>
                  Send a Message
                </h2>
                <p className="text-muted-foreground text-sm mb-8">Fill in the form and we'll get back to you shortly.</p>

                {sent ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground text-xl">Message Sent!</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Thank you for reaching out. We'll get back to you as soon as possible.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-2 text-primary font-medium text-sm hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Amaya Perera"
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="hello@example.com"
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Message
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="I'd love to ask about custom orders..."
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {sending ? (
                        <><Loader2 size={18} className="animate-spin" /> Sending...</>
                      ) : (
                        <><Send size={18} /> Send Message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

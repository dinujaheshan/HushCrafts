'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { 
  Mail, Send, Trash2, CheckCircle2, Loader2, 
  Search, ChevronDown, Clock, User 
} from '@/components/MaterialIcons';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied'>('all');

  // Reply Modal States
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Permission Guard
  const admin = useAdminAuthStore(s => s.admin);
  const canWrite = admin?.role === 'super_admin' || admin?.permissions.manageMessages;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'contact_messages'));
      const list = snapshot.docs.map((doc): any => {
        const data = doc.data();
        let messageDate = 'Recent';
        if (data.createdAt) {
          const d = data.createdAt.seconds 
            ? new Date(data.createdAt.seconds * 1000) 
            : new Date(data.createdAt);
          messageDate = d.toLocaleString('en-LK', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return {
          id: doc.id,
          ...data,
          formattedDate: messageDate,
          status: data.status || 'pending'
        };
      });

      // Sort messages newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setMessages(list);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleOpenReplyModal = (msg: any) => {
    setSelectedMessage(msg);
    setReplyText(msg.replyText || '');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      // 1. Add client notification in Firestore for client portal/navbar bell
      await addDoc(collection(db, 'client_notifications'), {
        email: selectedMessage.email.toLowerCase(),
        title: 'Reply to your inquiry',
        message: replyText.trim(),
        isRead: false,
        createdAt: serverTimestamp()
      });

      // 2. Update status in contact_messages
      const docRef = doc(db, 'contact_messages', selectedMessage.id);
      await updateDoc(docRef, {
        status: 'replied',
        replyText: replyText.trim(),
        repliedAt: new Date().toISOString(),
        repliedBy: admin?.name || 'Administrator'
      });

      // Update local state
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? {
        ...m,
        status: 'replied',
        replyText: replyText.trim()
      } : m));

      setSelectedMessage(null);
      setReplyText('');
      alert('Reply saved and sent to customer notifications successfully!');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Error sending support reply. Please check database permissions.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!canWrite) return;
    if (!confirm('Are you sure you want to permanently delete this message record?')) return;

    try {
      await deleteDoc(doc(db, 'contact_messages', msgId));
      setMessages(prev => prev.filter(m => m.id !== msgId));
      alert('Message deleted successfully.');
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Error deleting message.');
    }
  };

  const filtered = messages.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Support Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer inquiries submitted via the client Contact form.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Inquiries', value: messages.length, icon: <Mail size={18} /> },
          { label: 'Pending Response', value: messages.filter(m => m.status === 'pending').length, icon: <Clock size={18} /> },
          { label: 'Replied Inquiries', value: messages.filter(m => m.status === 'replied').length, icon: <CheckCircle2 size={18} /> }
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-card border border-border rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shrink-0 shadow-sm text-primary">
              {icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or message contents..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="appearance-none pl-4 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="all">All Inquiries</option>
            <option value="pending">Pending Reply</option>
            <option value="replied">Replied</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={36} className="text-primary animate-spin" />
          <p className="text-sm font-medium">Loading customer messages...</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/35 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <th className="px-6 py-4">Sender Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Inquiry Message</th>
                  <th className="px-6 py-4">Date Submitted</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(msg => (
                  <tr 
                    key={msg.id} 
                    className={`border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors ${
                      msg.status === 'pending' ? 'bg-amber-500/5 dark:bg-amber-950/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 uppercase shadow-inner">
                          {msg.name ? msg.name.charAt(0) : 'C'}
                        </div>
                        <span className="font-semibold text-sm text-foreground">{msg.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-semibold">
                      {msg.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {msg.message}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-semibold">
                      {msg.formattedDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        msg.status === 'pending' 
                          ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                          : 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300'
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReplyModal(msg)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          {msg.status === 'replied' ? 'View Reply' : 'Compose Reply'}
                        </button>
                        {canWrite && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500 cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground text-sm font-medium">
                      No support inquiries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-background border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/40">
              <h3 className="font-serif font-bold text-lg text-foreground">
                {selectedMessage.status === 'replied' ? 'Support Ticket (Closed)' : 'Compose Support Response'}
              </h3>
              <button 
                onClick={() => setSelectedMessage(null)} 
                className="text-muted-foreground hover:text-foreground cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Message Details */}
              <div className="bg-secondary/20 p-4 border border-border/60 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedMessage.name} ({selectedMessage.email})</span>
                  <span>{selectedMessage.formattedDate}</span>
                </div>
                <p className="text-sm text-foreground/90 font-medium whitespace-pre-wrap">"{selectedMessage.message}"</p>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {selectedMessage.status === 'replied' ? 'Sent Reply Message' : 'Type Support Reply'}
                  </label>
                  <textarea
                    required
                    disabled={selectedMessage.status === 'replied' || !canWrite}
                    rows={6}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply to send to the client..."
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary disabled:opacity-80 disabled:cursor-not-allowed resize-none transition-colors"
                  />
                </div>

                {selectedMessage.status === 'replied' && (
                  <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase flex items-center gap-1 pt-1">
                    <CheckCircle2 size={12} /> Replied by {selectedMessage.repliedBy || 'System'}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="flex-1 py-3 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  
                  {selectedMessage.status === 'pending' && (
                    <button
                      type="submit"
                      disabled={sendingReply || !canWrite}
                      className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {sendingReply ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Send Reply
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

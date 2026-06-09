import { useState } from 'react';
import { Flag, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface ReportButtonProps {
    targetType: 'listing' | 'event' | 'user' | 'message';
    targetId: string;
    /** Compact icon-only mode (cards) vs full text button. */
    variant?: 'icon' | 'text';
    className?: string;
}

const REASONS = [
    { value: 'inappropriate', label: 'Contenido inapropiado u ofensivo' },
    { value: 'illegal', label: 'Producto/servicio ilegal o falsificado' },
    { value: 'copyright', label: 'Infracción de copyright' },
    { value: 'scam', label: 'Estafa o fraude' },
    { value: 'spam', label: 'Spam o publicación duplicada' },
    { value: 'impersonation', label: 'Suplantación de identidad' },
    { value: 'other', label: 'Otro motivo' },
];

export default function ReportButton({ targetType, targetId, variant = 'icon', className = '' }: ReportButtonProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('inappropriate');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            toast.error('Debes iniciar sesión para reportar');
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, 'reports'), {
                reporterId: user.uid,
                reporterEmail: user.email,
                targetType,
                targetId,
                reason,
                details: details.trim().slice(0, 500),
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast.success('Reporte enviado. Lo revisaremos lo antes posible.');
            setOpen(false);
            setReason('inappropriate');
            setDetails('');
        } catch (err) {
            console.error('Report error:', err);
            toast.error('No pudimos enviar el reporte. Inténtalo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                aria-label="Reportar contenido"
                className={
                    variant === 'icon'
                        ? `text-muted-foreground hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-muted ${className}`
                        : `inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors ${className}`
                }
            >
                <Flag size={variant === 'icon' ? 14 : 12} />
                {variant === 'text' && <span>Reportar</span>}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !submitting && setOpen(false)}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-foreground font-bold flex items-center gap-2">
                                        <Flag size={16} className="text-red-400" /> Reportar contenido
                                    </h3>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        Cuéntanos qué pasa. Revisamos cada reporte.
                                    </p>
                                </div>
                                <button
                                    onClick={() => !submitting && setOpen(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Motivo</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-border bg-muted px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                                >
                                    {REASONS.map(r => (
                                        <option key={r.value} value={r.value} className="bg-[#1a1a1a]">{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Detalles (opcional)</label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                                    placeholder="Más contexto sobre el problema..."
                                    className="w-full rounded-lg border border-border bg-muted p-3 text-sm text-foreground min-h-[80px] resize-none focus:outline-none focus:border-primary"
                                />
                                <p className="text-xs text-muted-foreground text-right">{details.length}/500</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => !submitting && setOpen(false)}
                                    className="flex-1 h-10 rounded-xl border border-border text-foreground hover:bg-muted text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 h-10 rounded-xl bg-red-500/90 text-white hover:bg-red-500 text-sm font-semibold flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    Enviar reporte
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

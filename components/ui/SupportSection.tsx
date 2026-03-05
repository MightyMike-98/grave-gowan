/**
 * @file components/ui/SupportSection.tsx
 * @description Spenden- und Unterstützungs-Bereich der Gedenkseite.
 *
 * Zeigt eine Spendenkarte mit Beschreibungstext und roten Spenden-Buttons.
 * Bei Buttonklick öffnet sich ein modaler Bottom-Sheet-Dialog, in dem der Nutzer
 * einen Spendenbetrag auswählen und eine simulierte Zahlung bestätigen kann.
 * Nach der Spende wird die `onDonate`-Callback-Funktion aufgerufen,
 * die eine virtuelle Blume im Hero-Bereich erscheinen lässt.
 *
 * Benötigt 'use client', da useState (Modal-Zustand, Betrag, Ladezustand) und
 * onClick-Handler im Browser ausgeführt werden müssen.
 */

'use client';

import type { SupportSection as SupportSectionType } from '@/types';
import { useState } from 'react';

/** Verfügbare Spendenbeträge in Dollar. */
const DONATION_AMOUNTS = [10, 25, 50, 100];

/** Props der SupportSection-Komponente. */
interface SupportSectionProps {
    /** Der Spenden-Abschnitt des Memorials mit Beschreibung und Links. Wenn undefined, wird nichts gerendert. */
    support?: SupportSectionType;
    /** Callback der aufgerufen wird, nachdem eine Spende erfolgreich abgeschlossen wurde. */
    onDonate?: () => void;
}

/**
 * Rendert die Spenden-Sektion mit Karte, Charity-Buttons und modalem Zahlungs-Dialog.
 * Gibt `null` zurück, wenn kein `support`-Objekt übergeben wird.
 *
 * @param support - Optionales Support-Objekt mit Beschreibung und Charity-Links.
 * @param onDonate - Callback, der nach erfolgreicher Spende aufgerufen wird.
 */
export function SupportSection({ support, onDonate }: SupportSectionProps) {
    /** Steuert, ob der modale Spenden-Dialog geöffnet ist. */
    const [modalOpen, setModalOpen] = useState(false);

    /** Die aktuell im Modal ausgewählte Charity. */
    const [selectedCharity, setSelectedCharity] = useState<{ title: string; url: string } | null>(null);

    /** Der aktuell ausgewählte Spendenbetrag in Dollar. */
    const [selectedAmount, setSelectedAmount] = useState(25);

    /** Zeigt an, ob die Zahlung gerade simuliert wird (Ladezustand). */
    const [processing, setProcessing] = useState(false);

    // Wenn kein Support-Objekt vorhanden, nichts rendern
    if (!support) return null;

    /**
     * Öffnet den modalen Dialog und speichert die ausgewählte Charity.
     * @param link - Die Charity, für die gespendet werden soll.
     */
    const handleOpenModal = (link: { title: string; url: string }) => {
        setSelectedCharity(link);
        setModalOpen(true);
    };

    /**
     * Simuliert eine Zahlungsverarbeitung (1,5 Sekunden Verzögerung).
     * Schließt danach das Modal, ruft `onDonate` auf und zeigt eine Bestätigung.
     */
    const handleDonate = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setModalOpen(false);
            onDonate?.();
            alert(`Thank you for donating $${selectedAmount} to ${selectedCharity?.title}. A flower has been placed.`);
        }, 1500);
    };

    return (
        <section aria-label="Support & Legacy" className="px-6 py-8">
            {/* Spendenkarte */}
            <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-6">
                    <span className="text-3xl">💐</span>
                </div>

                <h2 className="text-2xl font-bold text-stone-800 mb-2">Lay a Virtual Flower</h2>
                <p className="text-stone-600 italic leading-relaxed mb-8 max-w-sm">
                    &ldquo;{support.description}&rdquo;
                </p>

                {/* Ein roter Button pro Charity aus der Support-Liste */}
                <div className="w-full space-y-3">
                    {support.links.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => handleOpenModal(link)}
                            className="w-full bg-rose-700 text-white font-semibold text-sm uppercase tracking-widest py-4 rounded-full shadow-lg shadow-rose-700/20 hover:bg-rose-800 transition-colors"
                        >
                            Donate to {link.title}
                        </button>
                    ))}
                </div>

                <p className="mt-6 text-xs text-stone-400">Secure in-app donation</p>
            </div>

            {/* Modaler Bottom-Sheet-Dialog */}
            {modalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Donate to ${selectedCharity?.title}`}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
                    // Klick auf den dunklen Overlay-Hintergrund schließt das Modal
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModalOpen(false);
                    }}
                >
                    <div className="w-full max-w-lg bg-white rounded-t-3xl p-8 pb-16 space-y-6">
                        {/* Modal-Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-stone-800">
                                Donate to {selectedCharity?.title}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                aria-label="Close modal"
                                className="text-stone-500 hover:text-stone-800 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Betrag-Auswahl */}
                        <div>
                            <p className="text-stone-500 mb-3 text-sm">Select Amount</p>
                            <div className="grid grid-cols-4 gap-3">
                                {DONATION_AMOUNTS.map((amount) => {
                                    const isSelected = selectedAmount === amount;
                                    return (
                                        <button
                                            key={amount}
                                            onClick={() => setSelectedAmount(amount)}
                                            className={[
                                                'py-3 rounded-lg border font-semibold text-sm transition-colors',
                                                isSelected
                                                    ? 'bg-rose-700 border-rose-700 text-white'
                                                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100',
                                            ].join(' ')}
                                        >
                                            ${amount}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Zahlungs-Button mit Ladezustand */}
                        <button
                            onClick={handleDonate}
                            disabled={processing}
                            className="w-full bg-stone-900 text-white py-5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-colors"
                        >
                            {processing ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <span>💳</span>
                                    <span>Pay ${selectedAmount}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

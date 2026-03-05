# Cloudyard - Web Interface

Dies ist die neue, saubere Web-Architektur von Cloudyard, basierend auf **Next.js 14**, dem **App Router** und **Tailwind CSS**. 

Dieses Projekt wurde aus dem ursprünglichen Expo/React Native-Code extrahiert und in eine eigenständige, SEO-freundliche und hochperformante Web-Anwendung refaktorisiert.

---

## 🚀 Wie starte ich das Projekt?

Dies ist ein Next.js-Projekt. Es gibt zwei wichtige Befehle, die du im Terminal (im Ordner `grave-web`) ausführen kannst:

### 1. Für die Entwicklung (Development)
```bash
npm run dev
```
Startet einen lokalen Entwicklungs-Server, standardmäßig auf [http://localhost:3000](http://localhost:3000). 
- **Vorteil:** Wenn du eine Datei änderst und speicherst, aktualisiert sich die Seite im Browser **automatisch** (Live Reload).
- *Hinweis: Während du diesen Modus nutzt, siehst du unten links im Browser ein kleines schwarzes "N". Das ist der Next.js Compile-Indikator, der dir anzeigt, wenn die App im Hintergrund gerade deine Änderungen verarbeitet. Das ist normal und auf dem Live-Server für Nutzer später unsichtbar.*

### 2. Für den Live-Betrieb (Production)
Wenn du testen möchtest, wie die Seite auf einem echten Webserver laufen würde (optimiert, viel schneller), musst du sie zuerst "bauen" und dann starten:
```bash
npm run build
npm start
```

---

## 📁 Ordnerstruktur - Wie ist alles aufgebaut?

Das Projekt folgt der modernen "App Router" Architektur von Next.js. Die alte Struktur mit ineinander verschachtelten Styles wurde durch sauberes Tailwind CSS und eigene Komponenten ersetzt.

### `/app`
Hier liegen alle Seiten (Routes) der Website:
- `page.tsx`: Die einfache Startseite (Landing Page)
- `layout.tsx`: Die globale HTML-Struktur (Meta-Tags, Google Font "Inter", Hintergrundfarbe)
- `globals.css`: Globale Tailwind-Einbindung & kleine Helfer (z.B. versteckte Scrollbars)
- `/visit/page.tsx`: Das Formular zur Eingabe einer Memorial-ID.
- `/dashboard/page.tsx`: Die Dashboard-Ansicht (Mock-Status).
- `/create/page.tsx`: Das mehrteilige Formular zum Erstellen eines Memorials.
- `/memorial/[id]/page.tsx`: **Das Herzstück**. Hier wird die eigentliche Gedenkseite gerendert.

### `/components/ui`
Hier liegen alle wiederverwendbaren Bausteine (Komponenten):
- `HeroSection.tsx`: Oben das Titelbild, Porträt und Name
- `TabsNavigation.tsx`: Die klick- und scrollbaren Reiter (About, Timeline, etc.)
- `MemorialTabs.tsx`: Verwaltet den "Zustand" (State), welcher Tab gerade offen ist und ob Blumen platziert wurden.
- `AboutSection.tsx`, `TimelineSection.tsx`, `StoriesSection.tsx`, `GalleryGrid.tsx`, `HighlightsSection.tsx`: Die einzelnen Inhaltsbereiche der Reiter.
- `SupportSection.tsx`: Spendenfunktion inklusive des Pop-Up Dialogs.

### `/lib`
Hilfsdateien. 
- `mock-data.ts`: Da wir noch keine Datenbank angebunden haben, liegen hier die **Dummy-Daten** (Sarah Jenkins). Überall in der App wird für Tests aktuell auf diese Datei zugegriffen.

### `/types`
- `index.ts`: TypeScript-Definitionen. Hier ist festgelegt, wie ein "Memorial" oder ein "Timeline-Event" genau auszusehen hat (welche Datenfelder sie haben müssen).

---

## 🛠 Wichtige Architektur-Entscheidungen

1. **Server vs. Client Components:**
   - Next.js 14 rendert standardmäßig alles auf dem Server (für bestes SEO und beste Geschwindigkeit). Fast alle unsere UI-Bausteine (wie das `HeroSection` oder die Text-Komponenten) sind simple **Server Components**.
   - Wir nutzen `"use client"` nur da, wo es nötig ist:
     - Bei der reinen `TabsNavigation` (User klickt auf Tab).
     - Beim Spendenkarten-PopUp `SupportSection` (Button Klick öffnet Modal).
     - Den State, "welcher Tab gerade offen ist", sammelt die Datei `MemorialTabs.tsx`.

2. **Tailwind CSS (`className="..."`)**
   - Es gibt keine klassischen CSS-Dateien und Inline-Styles mehr. Alles wird zentral über standardisierte Tailwind-Klassen (`text-stone-800`, `bg-stone-100`, `flex` etc.) gelöst. 
   - Das sorgt dafür, dass das Design **exakt** so aussieht wie dein Mobile-Prototyp, aber der Code sauber und wiederverwendbar bleibt.

3. **Bilder (`next/image`)**
   - Das Projekt nutzt die sehr performante, Next.js eigene `Image`-Komponente statt dem normalen `<img>`-Tag. 
   - Das macht die Startseite rasant. (Damit unsere Placeholder-Bilder von Unsplash.com funktionieren, wurde Unsplash in der Datei `next.config.ts` erlaubt).

---

## 🔜 Nächste Schritte (Backend)

Aktuell greift diese Webversion noch auf die `DUMMY_MEMORIAL`-Daten aus `/lib/mock-data.ts` zurück. 

Wenn du bereit bist (z.B. mit Supabase) eine echte Datenbank anzubinden:
1. Ersetze in `/app/memorial/[id]/page.tsx` die Zeile `const memorial = DUMMY_MEMORIAL;` mit einem echten Datenbank-Fetch (`supabase.from('memorials')...`).
2. Tausche beim `/create`-Formular am Ende den simulierten Timeout durch einen Insert-Befehl in die Datenbank aus.

# Handwerk.ai

B2B Micro-SaaS für Handwerker: Angebote per Spracheingabe erstellen. Mobile-first Web-App mit Next.js und Supabase.

## Tech-Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide React
- **Backend:** Supabase (PostgreSQL, Storage)
- **AI:** OpenAI Whisper (Transkription), Anthropic Claude (Strukturierung)

## Schnellstart (lokal)

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Öffne `http://localhost:3000` auf dem Smartphone (gleiches WLAN) oder im Browser mit DevTools (Mobile-Ansicht).

Ohne API-Keys läuft die App im **Mock-Modus** mit Beispiel-Transkript und festen Positionen.

## Supabase einrichten

1. Neues Projekt auf [supabase.com](https://supabase.com) anlegen.
2. **SQL Editor:** Migrationen ausführen:
   - [`001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   - [`002_auth_rls.sql`](supabase/migrations/002_auth_rls.sql)
3. **Authentication → Providers:** E-Mail aktiviert. Für Tests optional „Confirm email“ deaktivieren.
4. **Authentication → URL Configuration:** Redirect URLs ergänzen:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`
   - (später deine Produktions-URL)
5. **Storage:** Buckets anlegen (public):
   - `logos` – Firmenlogos für PDF
   - `quote-pdfs` – generierte Angebote
5. **Project Settings → API** – Keys in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Auth

- `/register` – Konto + Firmenname
- `/login` – Anmeldung
- `/forgot-password` – Passwort-Reset per E-Mail
- Geschützte Routen: Dashboard, Angebote, Profil
- **Profil:** Logo hochladen, Firmendaten, Abmelden
- **PWA:** App zum Home-Bildschirm hinzufügen (Chrome/Safari „Zum Startbildschirm“)

Ohne Supabase-Keys: Dev-Modus mit `DEV_USER_ID` (kein Login nötig).

## API-Keys (optional)

| Variable | Zweck |
|----------|--------|
| `OPENAI_API_KEY` | Whisper Transkription |
| `ANTHROPIC_API_KEY` | Claude Angebotspositionen |
| `DEV_USER_ID` | Dev-Handwerker-UUID (Standard in Migration) |

## DSGVO-Datenfluss (Kundendaten ≠ LLM)

1. **Kunde speichern** (`POST /api/customers`) – Name/Adresse nur in Supabase  
2. **Transkribieren** (`POST /api/transcribe`) – Audio → Text (Leistungen)  
3. **Angebot** (`POST /api/process-quote`) – nur `transcript` + `customer_id`; Claude erhält **keinen** Namen/Adresse  
4. **PDF** (`POST /api/generate-pdf`) – Kunde per `customer_id` aus DB, Posten aus DB oder LLM nur aus Transkript, Zusammenführung **nur auf dem Server**

## Routen

| Pfad | Beschreibung |
|------|----------------|
| `/login` | Anmeldung |
| `/register` | Registrierung |
| `/dashboard` | Letzte Angebote |
| `/quotes/new` | Wizard: Kunde → Aufnahme → KI |
| `/quotes/[id]/edit` | Angebot bearbeiten |
| `/profile` | Firmenprofil, Logo, Abmelden |
| `/api/customers` | Kunde in Supabase speichern → `customer_id` |
| `/api/transcribe` | Audio → Text |
| `/api/process-quote` | `customer_id` + Transkript → JSON + DB |
| `/api/generate-pdf` | PDF aus DB-Daten + Posten |

## Dev-Modus

Ohne Supabase nutzt die App `DEV_USER_ID` aus `.env.local` – Login wird übersprungen.

## Projektstruktur

```
src/
  app/           # Seiten & API Routes
  components/    # UI (Layout, Quotes)
  hooks/         # useAudioRecorder
  lib/           # Supabase, AI, PDF, Types
supabase/migrations/
```

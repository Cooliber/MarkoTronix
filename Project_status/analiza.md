Gap Analysis: czego brakuje w repo MarkoTronix względem pełnego CRM/ERP dla HVAC
Poniżej zestawienie kluczowych funkcji CRM/ERP, których nie znalazłem w obecnym repo i które trzeba wdrożyć, aby uzyskać kompletne rozwiązanie.

> **Uwaga**: Szczegółowy status implementacji poszczególnych funkcji można znaleźć w [podsumowaniu statusu implementacji](./implementation_status_summary.md).

1. Ingest & Enrichment danych
Telefoniczne transkrypcje MP3 ← istnieje tylko ogólne API do transkrypcji, brakuje
E-maile od klientów z automatycznym kategoryzowaniem i ekstrakcją danych (formularze, faktury)
OCR dla skanów PDF (faktur, protokołów)
Lokalny web-crawler do pozyskiwania zleceń i wolnych ekip
2. Automatyczne uzupełnianie profilu klienta
Formularz do uzupełniania profilu przez klienta z linkiem SMS/email
Analiza call-sentiment & credit-worthiness na podstawie transkrypcji
Integracja z zewnętrzną bazą firm (wg NIP, REGON)
3. Komunikacja i powiadomienia
Bramka SMS (np. Twilio)
Push-notifications (mobilne / web-push)
Chat-bot / integracja Telegram/Slack
4. Zarządzanie relacjami z klientem
Pełny moduł CRM:
Kanban pipeline (lead → oferta → montaż → serwis → płatność)
Dashboard "statusy klientów" (od momentu powstania zlecenia do zakończenia)
Kalendarz wielotworzywy (oględziny, montaże, serwisy)
5. Dynamiczne oferty i umowy
Generowanie wstępnej oferty na podstawie transkrypcji + LLM
Link do akceptacji oferty z opcją e-podpisu (CMS + digital-signature)
System wirtualnej prezentacji oferty (animacje, gratulacje)
6. Planowanie tras i geolokalizacja
Mapa z zaznaczonymi urządzeniami i klientami
Automatyczne dopasowanie zleceń serwisowych na podstawie adresu i dzielnicy
7. Zamawianie komponentów i magazyn
Baza dostawców + cenniki + porównywarka cen
Automatyczne składanie zamówień do dostawców z poziomu aplikacji
Moduł magazynu: stany, historie przyjęć/wydań
8. Serwis & raportowanie
Elektroniczne protokoły serwisowe (DOCX/PDF) z auto-wypełnianiem
Moduł checklist + dokumentacja fotograficzna
Wystawianie kart gwarancyjnych
9. Płatności i faktury
Integracja z bankowością (OCR PDF, rozpoznawanie przelewów)
Przypomnienia o płatnościach (wewnętrzne i klienta)
Historia płatności i raport finansowy
Propozycja rozbudowy architektury i modułów
A. Nowe mikroserwisy / moduły
ingest-service
Endpoints: /transcribe, /ingest/email, /ingest/ocr
Tech: Celery + FastAPI + Tesseract/pytesseract
crm-service
Zarządzanie profilem klienta, pipeline sprzedaży (kanban, kalendarz)
DB: PostgreSQL (schemat Leads/Offers/Appointments/Tasks)
offer-service
Generowanie, wersjonowanie, publikacja ofert + e-signature
Integracja LLM + digital signature provider
routing-service
Planowanie tras, mapy, geocoding (Mapbox/Google)
inventory-service
Dostawcy, ceny, zamówienia, stany magazynowe
billing-service
OCR faktur, bank API, przypomnienia SMS/mail, historia płatności
notification-service
SMS, push, webhooks, chat integrations
crawler-service (opcjonalnie)
Python + Scrapy, zarządzanie zadaniami, lokalny scheduler
B. Integracja frontendu
Rozszerzyć hvac-ui:
Strony/formularze: Profile, Oferta, Magazyn, Finansowanie
Komponenty mapy, kalendarza, kanbana
Formularz CR-U-D + weryfikacja i akceptacja ofert
Dalsze kroki i priorytetyzacja
MVP CRM Core
ingest-service (transkrypcje, OCR)
crm-service (Leads & kanban + kalendarz)
notification-service (SMS/email)
MVP Oferta
offer-service (LLM + link + e-signature)
Integracja w hvac-ui
MVP Serwis & Magazyn
inventory-service
routing-service
Proste protokoły serwisowe
Finanse i płatności
billing-service
Usprawnienia UX
push-notifications, chat, animations
Monitoring & Security
Każdy nowy serwis z health-check, circuit breaker, metryki
Taki podział pozwoli iteracyjnie zbudować w pełni funkcjonalny CRM/ERP. W kolejnym kroku możemy rozwinąć backlog dla MVP CRM Core – user stories, API spec'y i schemat bazy danych. Daj znać, od czego zaczynamy!
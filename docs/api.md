# API de Tomobilti

Toutes les routes répondent en JSON (sauf les PDF, le CSV et le sitemap), avec des
messages en français. Base : `http://localhost:8000` en développement.

## Conventions

- **Authentification** : cookies de session Sanctum. La SPA appelle d’abord
  `GET /sanctum/csrf-cookie`, puis envoie l’en-tête `X-XSRF-TOKEN` sur chaque requête
  qui modifie des données (axios le fait seul). Voir [architecture.md](architecture.md#2-authentification-cookies-sanctum-et-csrf).
- **Accès** : `public` (tout le monde), `session` (connecté), `vérifié` (connecté, e-mail
  vérifié), `agence` (rôle admin : 401 pour un visiteur, 403 pour un client, vérifié
  avant de chercher la ressource).
- **Erreurs** : `{ "message": "…" }`, plus `errors` pour une validation (422) :
  `{ "message": "…", "errors": { "email": ["…"] } }`. Codes : 401 non connecté,
  403 interdit (avec la raison), 404 introuvable (ou pas à vous), 409 conflit (voiture
  déjà réservée, élément encore utilisé), 419 session expirée, 422 validation,
  429 trop de requêtes.
- **Listes paginées** : `data`, `links`, `meta` (`current_page`, `last_page`, `total`…).
- **Montants** : chaînes décimales en DH TTC (`"1840.00"`). **Dates** : ISO 8601 en
  heure de Casablanca ; les dates de réservation s’envoient `AAAA-MM-JJ HH:MM`.
- **Limites de requêtes** : chaque route a au moins la limite générale (300 / min par
  utilisateur ou IP) ; les limites plus strictes sont indiquées dans la colonne « Accès ».
- **En-têtes de sécurité** sur chaque réponse : `nosniff`, `X-Frame-Options: DENY`,
  CSP `default-src 'none'`, `Referrer-Policy`, `Permissions-Policy` (voir
  [security.md](security.md)).

## Public : catalogue et site

| Méthode | Chemin | Accès | Paramètres principaux | Réponse |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | public | — | `{ status, app, time, database }` (503 si la base est injoignable) |
| GET | `/api/cars` | public, 60 / min | `category`, `brand`, `fuel`, `slug` (listes séparées par des virgules), `transmission`, `seats_min`, `price_min`, `price_max`, `location`, `air_conditioning`, `q`, `start_at` + `end_at` (`AAAA-MM-JJ`, libres sur toute la période), `sort` (`price_asc`, `price_desc`, `newest`, `popular`), `page` | 12 voitures disponibles par page (marque, catégorie, agence, photo principale) |
| GET | `/api/cars/featured` | public, 60 / min | — | Voitures à la une, la moins chère d’abord |
| GET | `/api/cars/{slug}` | public, 60 / min | — | Détail : photos 800 / 1600 px avec crédits, caractéristiques, caution, agence et horaires, `similar` ; 404 si en maintenance, hors service ou supprimée |
| GET | `/api/cars/{slug}/availability` | public, 60 / min | `from`, `to` (6 mois max) | `unavailable` : périodes déjà réservées (dates seules) |
| GET | `/api/catalog/filters` | public, 60 / min | — | Catégories, marques, agences avec le nombre de voitures disponibles, boîtes, carburants, places, prix min / max. En cache, vidé à chaque modification de l’agence |
| GET | `/api/categories` | public, 60 / min | — | Catégories dans l’ordre d’affichage, avec `cars_count`. En cache |
| GET | `/api/locations` | public, 60 / min | — | Agences actives : adresse, téléphone, horaires. En cache |
| GET | `/api/extras` | public, 60 / min | — | Options actives (siège bébé, GPS…) |
| GET | `/api/legal` | public, 60 / min | — | Valeurs des pages légales : `company`, `booking` (âge, permis, horaires, annulation, frais d’abandon), `rental` (carburant, kilométrage, retard, fourchette de caution, documents), `privacy` (durées de conservation). En cache |
| POST | `/api/contact` | public, 3 / 10 min par IP | `name`, `email`, `phone` (facultatif), `subject`, `message` | 200 ; e-mail à l’agence avec le visiteur en Reply-To |
| GET | `/sitemap.xml` | public | — | XML : pages publiques et chaque voiture disponible (URL de la SPA). En cache |

## Authentification et profil

| Méthode | Chemin | Accès | Paramètres principaux | Réponse |
| --- | --- | --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | public | — | 204 + cookie `XSRF-TOKEN` |
| GET | `/api/auth/session` | public, 60 / min | — | `{ data: UserResource }` ou `{ data: null }` (jamais 401) |
| POST | `/api/auth/register` | public, 6 / min | `name`, `email`, `phone`, `password`, `password_confirmation`, `terms` | 201, connecté ; e-mail de vérification envoyé. Rôle toujours `client` |
| POST | `/api/auth/login` | public, 20 / min par IP, 5 échecs / min par e-mail + IP | `email`, `password`, `remember` | 200 `UserResource` ; 403 compte désactivé ; 422 identifiants |
| POST | `/api/auth/logout` | session | — | 200, session invalidée |
| POST | `/api/auth/forgot-password` | public, 6 / min | `email` | 200, même réponse que le compte existe ou non |
| POST | `/api/auth/reset-password` | public, 6 / min | `token`, `email`, `password`, `password_confirmation` | 200 ; le lien expire après 60 minutes |
| POST | `/api/auth/email/verify/{id}/{hash}` | lien signé, 6 / min | `expires`, `signature` | 200 ; 403 `expired` ou `invalid` |
| POST | `/api/auth/email/verification-notification` | session, 6 / min | — | 200, nouveau lien envoyé |
| GET | `/api/user` | session | — | `UserResource` (jamais le mot de passe ni `is_active`) |
| PUT | `/api/profile` | session | `name`, `email`, `phone`, `city`, `address`, `birth_date`, `cin`, `driving_license_number`, `driving_license_issued_at` | 200 ; 18 ans minimum, permis après 18 ans ; un nouvel e-mail doit être revérifié |
| PUT | `/api/profile/password` | session, 6 / min | `current_password`, `password`, `password_confirmation` | 200 |

## Client : réservations et notifications

| Méthode | Chemin | Accès | Paramètres principaux | Réponse |
| --- | --- | --- | --- | --- |
| GET | `/api/booking-rules` | public, 120 / min | — | Règles de `config/tomobilti.php` : horaires, créneaux, délais, durée, âge, permis, annulation, frais d’abandon |
| POST | `/api/reservations/quote` | public, 120 / min | `car`, `start_at`, `end_at`, `pickup_location`, `return_location`, `extras: [{ slug, quantity }]` | Détail du prix TTC, `available` (+ message), et pour un client connecté `eligibility` (`eligible`, `reasons`, `missing_fields`) et `can_book` |
| POST | `/api/reservations` | vérifié, 10 / min | les champs du devis + `customer_notes`, `terms` | 201 réservation « en attente » ; 422 non éligible (raisons) ; **409** voiture réservée entre-temps |
| GET | `/api/reservations` | session | `tab` (`upcoming`, `current`, `past`, `cancelled`), `page` | 10 par page, `meta.counts` par onglet |
| GET | `/api/reservations/{référence}` | session | — | Ma réservation : voiture, agences, options, prix, dates de statut, `cancellation` (`allowed`, `reason`, `free_until`), `has_voucher`, `invoice` ; 404 si pas à moi |
| POST | `/api/reservations/{référence}/cancel` | session | `reason` (facultatif) | 200 ; 403 avec la raison (moins de 24 h avant, statut) |
| GET | `/api/reservations/{référence}/voucher` | session | — | PDF du bon de réservation (confirmée, en cours, terminée ; 404 avant) |
| GET | `/api/reservations/{référence}/invoice` | session | — | PDF de la facture (404 avant son émission) |
| GET | `/api/notifications` | session | `status` (`all`, `unread`, `read`), `page` | 15 par page, la plus récente d’abord, `meta.unread_count` |
| POST | `/api/notifications/{id}/read` | session | — | La notification, `meta.unread_count` ; 404 si pas à moi |
| POST | `/api/notifications/read-all` | session | — | `meta.unread_count: 0` |

## Agence (back-office)

Toutes sous `/api/admin`, accès **agence**, chaque action contrôlée aussi par une Policy.
Voitures et paramètres par identifiant, réservations par référence, factures par numéro.

| Méthode | Chemin | Paramètres principaux | Réponse |
| --- | --- | --- | --- |
| GET | `/dashboard` | `period` (`30d`, `90d`, `12m`) | KPI, départs et retours du jour et du lendemain, graphiques, alertes, dernières réservations |
| GET | `/reservations` | `tab` (`pending`, `today`, `active`, `all`), `status`, `from`, `to`, `car`, `location`, `q`, `sort`, `direction`, `page`, `per_page` | Liste paginée, `meta.counts` par onglet |
| GET | `/reservations/export` | mêmes filtres | CSV (UTF-8 avec BOM, `;`, virgule décimale, en-têtes français) |
| GET | `/reservations/{référence}` | — | Client, voiture, agences, options, prix, notes, chronologie, facture, historique |
| POST | `/reservations/{référence}/confirm` | — | en attente → confirmée (voiture revérifiée, 409 sinon) |
| POST | `/reservations/{référence}/reject` | `reason` | en attente → refusée |
| POST | `/reservations/{référence}/pick-up` | `payment_method` (`cash`, `card`, `bank_transfer`), `paid` | confirmée → en cours, facture émise |
| POST | `/reservations/{référence}/return` | — | en cours → terminée |
| POST | `/reservations/{référence}/cancel` | `reason` | en attente ou confirmée → annulée (sans délai pour l’agence) |
| PATCH | `/reservations/{référence}/notes` | `admin_notes` | Notes internes (jamais montrées au client) |
| GET | `/reservations/{référence}/voucher` | — | PDF du bon de réservation |
| GET | `/planning` | `from`, `to` (31 jours max) | Par voiture, ses réservations sur la période (hors annulées et refusées) |
| GET | `/cars` | `q`, `status`, `category`, `brand`, `location`, `deleted` (`with`, `only`), `sort`, `direction`, `page`, `per_page` | Flotte paginée |
| POST, GET, PUT | `/cars`, `/cars/{id}` | champs de la voiture | Immatriculation normalisée `12345-A-6`, unique ; slug marque + modèle + année |
| DELETE | `/cars/{id}` | — | Suppression douce ; 409 si des réservations à venir l’utilisent |
| POST | `/cars/{id}/restore` | — | Restaure une voiture supprimée |
| GET | `/cars/{id}/status-conflicts` | — | Réservations en attente ou confirmées pas encore terminées |
| PATCH | `/cars/{id}/status` | `status`, `force` | Sans `force` : 409 avec les réservations touchées |
| POST | `/cars/{id}/images` | `images[]` (1 à 10, JPG / PNG / WebP, 5 Mo, 400 × 250 à 8000 × 8000 px) | Photos recadrées 16:10, WebP 1600 et 800 px, métadonnées supprimées |
| PUT | `/cars/{id}/images/order` | `ids` | Nouvel ordre |
| PATCH, DELETE | `/cars/{id}/images/{image}` | `alt`, `is_primary` | Texte alternatif, photo principale / suppression avec les fichiers |
| GET | `/clients`, `/clients/{id}` | `q`, `active`, `verified`, `sort`, `direction`, `page` | Clients avec nombre de réservations et total dépensé ; détail avec historique |
| POST | `/clients/{id}/activate`, `/clients/{id}/deactivate` | — | La désactivation ferme toutes les sessions du client |
| GET | `/invoices` | `status`, `payment_method`, `from`, `to`, `q`, `sort`, `direction`, `page`, `per_page` | Factures, `meta.totals` (`count`, `total`, `paid`, `unpaid`) sur toute la liste filtrée |
| GET | `/invoices/{numéro}/pdf` | — | PDF de la facture |
| POST | `/invoices/{numéro}/mark-paid` | `payment_method` | 403 si déjà payée |
| POST | `/invoices/{numéro}/send` | — | Renvoie la facture au client par e-mail |
| GET, POST | `/categories`, `/brands`, `/locations`, `/extras` | champs de chaque ressource | Liste / création |
| PUT, DELETE | `/categories/{id}`, `/brands/{id}`, `/locations/{id}`, `/extras/{id}` | — | Modification / suppression ; 409 avec la raison si encore utilisé |

## Exemples

Devis (public) :

```http
POST /api/reservations/quote
Content-Type: application/json

{ "car": "peugeot-208-2025", "start_at": "2027-01-10 10:00", "end_at": "2027-01-13 10:00",
  "pickup_location": "marrakech-aeroport-menara", "return_location": "marrakech-aeroport-menara",
  "extras": [{ "slug": "siege-bebe", "quantity": 1 }] }
```

```json
{
  "data": {
    "car": { "slug": "peugeot-208-2025", "name": "Peugeot 208", "price_per_day": "350.00", "…": "…" },
    "start_at": "2027-01-10T10:00:00+00:00",
    "end_at": "2027-01-13T10:00:00+00:00",
    "pickup_location": { "slug": "marrakech-aeroport-menara", "name": "Marrakech Aéroport Menara", "…": "…" },
    "return_location": { "slug": "marrakech-aeroport-menara", "…": "…" },
    "pricing": {
      "days": 3, "price_per_day": "350.00", "car_total": "1050.00",
      "extras": [{ "slug": "siege-bebe", "name": "Siège bébé", "pricing": "per_day",
                   "unit_price": "40.00", "quantity": 1, "total": "120.00" }],
      "extras_total": "120.00", "fees": [], "fees_total": "0.00",
      "total": "1170.00", "deposit_amount": "7000.00"
    },
    "available": true,
    "unavailable_message": null,
    "eligibility": null,
    "can_book": false
  }
}
```

`eligibility` et `can_book` ne sont remplis que pour un client connecté.

Voiture réservée entre-temps :

```json
HTTP/1.1 409 Conflict
{ "message": "Cette voiture vient d’être réservée sur une partie de ces horaires. Choisissez d’autres dates ou une autre voiture." }
```

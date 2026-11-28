# Architecture de Tomobilti

Tomobilti est découpé en deux applications indépendantes qui ne partagent qu’un contrat
HTTP (du JSON sous `/api/*`) : une application monopage React et une API Laravel. Ce
document décrit leur organisation et les quatre mécanismes clés : l’authentification, la
réservation, le cycle de vie d’une réservation et la facturation avec ses e-mails.

Les détails de chaque route sont dans [api.md](api.md), le schéma de la base dans
[database.md](database.md), la sécurité dans [security.md](security.md).

## 1. Vue d’ensemble

```mermaid
flowchart LR
    navigateur["Navigateur<br/>(client ou agence)"]

    subgraph front["frontend/ : SPA React (Vite)"]
        spa["Pages, UI kit,<br/>TanStack Query, axios"]
    end

    subgraph back["backend/ : API Laravel"]
        api["Contrôleurs, Form Requests,<br/>Policies, Resources"]
        services["Services métier :<br/>tarif, éligibilité, réservation,<br/>workflow, factures, PDF"]
        cache[("Cache catalogue")]
    end

    mysql[("MySQL 8.4")]
    worker["Worker de file<br/>(queue:work)"]
    scheduler["Planificateur<br/>(schedule:run)"]
    mailpit["Mailpit<br/>(SMTP de développement)"]

    navigateur -->|HTML, JS, CSS| spa
    spa -->|"JSON + cookies Sanctum<br/>(XSRF-TOKEN)"| api
    api --> services
    services --> mysql
    api --> cache
    services -->|"jobs (e-mails,<br/>notifications)"| mysql
    worker -->|lit les jobs| mysql
    worker -->|e-mails + PDF| mailpit
    scheduler -->|"expire les demandes,<br/>rappels de prise en charge"| services
```

- **SPA React** (`frontend/`) : l’interface en français. Elle ne calcule jamais un prix
  ni une disponibilité : elle envoie les choix du client et affiche la réponse du serveur.
  Les données passent par TanStack Query (cache, rechargement, états de chargement).
- **API Laravel** (`backend/`) : uniquement du JSON. Chaque entrée est validée par une
  Form Request, chaque action protégée par une Policy, chaque sortie mise en forme par
  une API Resource. Les règles métier vivent dans des services
  (`ReservationPricing`, `BookingEligibility`, `ReservationBooker`, `ReservationWorkflow`,
  `ReservationDocuments`).
- **MySQL** : la seule source de vérité (voitures, réservations, historique des statuts,
  factures, notifications, sessions, file de jobs, cache).
- **Worker de file** : envoie les e-mails et les notifications en arrière-plan, pour que
  l’API réponde vite. Les e-mails partent **après la validation de la transaction**
  (`afterCommit`) : jamais d’e-mail pour une action annulée.
- **Planificateur** : toutes les 5 minutes, refuse les demandes dont l’heure de prise en
  charge est passée ; toutes les 15 minutes, envoie le rappel de la veille.
- **Mailpit** : reçoit tous les e-mails en développement (http://localhost:8025).

## 2. Authentification (cookies Sanctum et CSRF)

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant S as SPA React
    participant A as API Laravel
    participant DB as MySQL (sessions)

    S->>A: GET /sanctum/csrf-cookie
    A-->>S: 204 + cookie XSRF-TOKEN (lisible) + cookie de session
    S->>A: GET /api/auth/session
    A-->>S: 200 { data: null } (visiteur)
    U->>S: e-mail + mot de passe
    S->>A: POST /api/auth/login (en-tête X-XSRF-TOKEN)
    A->>A: vérifie le jeton CSRF, la limite d’essais, le compte actif
    A->>DB: régénère la session, l’associe à l’utilisateur
    A-->>S: 200 UserResource + nouveau cookie de session (HttpOnly)
    S->>A: GET /api/reservations (cookie de session envoyé automatiquement)
    A-->>S: 200 (ou 401 si la session a expiré : la SPA se déconnecte)
    Note over S,A: Un 419 (jeton CSRF expiré) : axios redemande<br/>le cookie CSRF puis rejoue la requête une fois.
```

- **Pourquoi des cookies et pas des jetons** : le cookie de session est `HttpOnly` (un
  script ne peut pas le lire, donc pas de vol par XSS) et `SameSite=Lax`. Le jeton CSRF
  protège les requêtes qui modifient des données.
- La SPA et l’API sont sur le même site (`localhost`, `tomobilti.ma` /
  `api.tomobilti.ma` en production) : le navigateur partage les cookies. Les domaines de
  la SPA sont déclarés dans `SANCTUM_STATEFUL_DOMAINS` et dans CORS (`FRONTEND_URL`).
- **Limites** : 5 échecs par minute par e-mail et IP, 20 essais par minute par IP. Un
  compte désactivé reçoit un 403 ; sa désactivation supprime ses sessions.
- Au démarrage, la SPA appelle `GET /api/auth/session` (l’utilisateur, ou `null`) : un
  visiteur ne produit pas d’erreur 401 dans la console.

## 3. Réservation (devis, éligibilité, verrou, 409)

```mermaid
sequenceDiagram
    autonumber
    actor C as Client
    participant S as SPA React
    participant A as API Laravel
    participant DB as MySQL

    C->>S: choisit dates, agences, options
    S->>A: POST /api/reservations/quote (debounce 350 ms)
    A->>DB: voiture, réservations qui bloquent la période
    A-->>S: détail du prix TTC, disponible ?, éligibilité (âge, permis, profil)
    C->>S: coche les conditions, « Confirmer la réservation »
    S->>A: POST /api/reservations (une seule requête même sur double clic)
    A->>A: Form Request : créneaux, délais, durée, options
    A->>A: BookingEligibility : e-mail vérifié, profil complet, 21 ans, 2 ans de permis
    alt client non éligible
        A-->>S: 422 avec les raisons en français
    end
    A->>DB: BEGIN, SELECT … FOR UPDATE sur la voiture
    A->>DB: une réservation bloquante chevauche-t-elle la période ?
    alt déjà réservée entre-temps
        A->>DB: ROLLBACK
        A-->>S: 409 « Cette voiture vient d’être réservée… »
        S-->>C: alerte + voitures similaires libres
    else libre
        A->>DB: INSERT réservation « en attente » (prix, options, caution figés)
        A->>DB: historique de statut, COMMIT
        A->>DB: jobs : e-mail « Demande reçue », notification de l’agence
        A-->>S: 201 + référence TMB-AAAA-NNNNNN
    end
```

- **Le serveur fixe le prix** : `ReservationPricing` calcule jours × prix par jour,
  options (par jour ou par location), frais d’abandon. La SPA n’envoie jamais de prix.
  Les montants sont figés dans la réservation : un changement de tarif ne modifie pas
  les réservations existantes.
- **Pas de double réservation** : la transaction verrouille la ligne de la voiture
  (`lockForUpdate`). Deux clients qui confirment la même voiture au même instant sont
  traités l’un après l’autre ; le second voit la première réservation et reçoit un 409.
- **Côté SPA** : `useSingleFlightMutation` ignore un second clic pendant la requête, et
  le brouillon (dates, options, étape) est gardé dans `sessionStorage`.

## 4. Cycle de vie d’une réservation

```mermaid
stateDiagram-v2
    [*] --> pending: le client réserve
    pending --> confirmed: l’agence confirme
    pending --> rejected: l’agence refuse (motif)
    pending --> rejected: heure de prise en charge passée (planificateur)
    pending --> cancelled: le client (plus de 24 h avant) ou l’agence (motif)
    confirmed --> cancelled: le client (plus de 24 h avant) ou l’agence (motif)
    confirmed --> active: voiture récupérée, paiement noté, facture émise
    active --> completed: voiture rendue
    completed --> [*]
    rejected --> [*]
    cancelled --> [*]
```

| Statut | Libellé | Bloque la voiture |
| --- | --- | --- |
| `pending` | En attente | oui |
| `confirmed` | Confirmée | oui |
| `active` | En cours | oui |
| `completed` | Terminée | non |
| `rejected` | Refusée | non |
| `cancelled` | Annulée | non |

- Les transitions autorisées sont définies une seule fois, dans
  `ReservationStatus::allowedTransitions()`. Toute autre transition répond 403 avec la
  raison en français.
- **Chaque changement passe par `ReservationWorkflow`** : verrou de la ligne, contrôle de
  la transition, date et motif enregistrés, ligne dans `reservation_status_histories`
  avec l’auteur (client, agence ou planificateur). La confirmation revérifie que la
  voiture est toujours libre (409 sinon).
- La SPA de l’agence n’affiche que les boutons permis par le statut
  (`actionsForStatus`, miroir des règles du serveur).

## 5. Facture et e-mails

```mermaid
sequenceDiagram
    autonumber
    actor Ag as Agence
    participant S as SPA (back-office)
    participant A as API Laravel
    participant DB as MySQL
    participant W as Worker de file
    participant M as Mailpit (SMTP)
    actor C as Client

    Ag->>S: « Marquer comme récupérée » (espèces, payé maintenant)
    S->>A: POST /api/admin/reservations/{ref}/pick-up
    A->>DB: BEGIN, verrou de la réservation
    A->>DB: confirmed → active, historique
    A->>DB: Invoice::issueFor : FAC-AAAA-NNNNNN, HT, TVA 20 %, TTC, payée
    A->>DB: COMMIT
    A->>DB: job InvoiceIssued (après le commit)
    A-->>S: 200 réservation + facture
    W->>DB: prend le job
    W->>W: PDF de la facture (dompdf, Plus Jakarta Sans)
    W->>M: e-mail « Votre facture » + PDF en pièce jointe
    W->>DB: notification dans l’application (cloche du client)
    M-->>C: e-mail reçu
    C->>S: Mon espace : « Télécharger la facture »
    S->>A: GET /api/reservations/{ref}/invoice
    A-->>S: PDF (seulement sa propre réservation, 404 sinon)
```

- **Le paiement a lieu à l’agence**, à la prise en charge : la même transaction passe la
  réservation « en cours » et émet la facture, payée ou à encaisser. Une facture à
  encaisser est marquée payée plus tard depuis `/admin/factures`.
- Les montants de la facture sont TTC, comme réservés ; `Invoice::splitTotal()` calcule
  HT et TVA avec bcmath (pas d’erreur d’arrondi). La facture écrit le montant en lettres
  (exigence marocaine) et tous ses montants au centime (« 1.840,00 DH »).
- Le numéro est séquentiel par année ; en cas de conflit sur l’index unique, l’émission
  est retentée.
- **Chaque événement envoie ses e-mails une seule fois**, après le commit, par
  `ReservationNotifier` : demande reçue, confirmée (avec le bon de réservation PDF),
  refusée, annulée, rappel la veille, facture, remerciement.

## 6. Organisation du code

| Dossier | Rôle |
| --- | --- |
| `backend/app/Http/Controllers` | Contrôleurs fins par zone (`Catalog`, `Auth`, `Reservation`, `Admin`) |
| `backend/app/Http/Requests` | Validation (Form Requests), messages en français |
| `backend/app/Policies` | Qui peut faire quoi (client : ses réservations ; agence : tout) |
| `backend/app/Services` | Règles métier : tarif, éligibilité, réservation, workflow, PDF, cache |
| `backend/app/Notifications` | E-mails et notifications dans l’application |
| `frontend/src/pages` | Une page par route (public, `account`, `booking`, `admin`, `legal`) |
| `frontend/src/components/ui` | UI kit (boutons, champs, dialogues, tableaux…) |
| `frontend/src/hooks`, `src/api` | Accès aux données (TanStack Query + axios) |
| `frontend/src/lib` | Libellés français, règles miroir, formats, animations |

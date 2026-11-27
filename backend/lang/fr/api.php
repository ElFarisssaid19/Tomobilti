<?php

return [

    'errors' => [
        'default' => 'Une erreur est survenue.',
        '400' => 'Requête invalide.',
        '401' => 'Vous devez être connecté pour accéder à cette ressource.',
        '403' => "Vous n'êtes pas autorisé à effectuer cette action.",
        '404' => 'Ressource introuvable.',
        '405' => 'Méthode HTTP non autorisée pour cette route.',
        '419' => 'Votre session a expiré. Veuillez rafraîchir la page.',
        '429' => 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
        '500' => 'Erreur interne du serveur.',
        '503' => 'Service temporairement indisponible.',
    ],

    'auth' => [
        'registered' => 'Compte créé. Un e-mail de vérification vous a été envoyé.',
        'logged_in' => 'Connexion réussie.',
        'logged_out' => 'Vous êtes déconnecté.',
        'inactive' => 'Votre compte est désactivé. Contactez l’agence pour le réactiver.',
        'reset_link_sent' => 'Si un compte existe pour cette adresse, vous allez recevoir un lien de réinitialisation dans quelques instants.',
    ],

    'verification' => [
        'verified' => 'Votre adresse e-mail est vérifiée.',
        'already_verified' => 'Votre adresse e-mail est déjà vérifiée.',
        'sent' => 'Un nouveau lien de vérification vous a été envoyé.',
        'expired' => 'Ce lien de vérification a expiré. Demandez-en un nouveau.',
        'invalid' => 'Ce lien de vérification n’est pas valide.',
    ],

    'profile' => [
        'updated' => 'Profil enregistré.',
        'updated_verify_email' => 'Profil enregistré. Confirmez votre nouvelle adresse e-mail avec le lien que nous venons de vous envoyer.',
        'password_updated' => 'Mot de passe modifié.',
    ],

    'contact' => [
        'sent' => 'Merci, votre message a bien été envoyé. L’agence vous répondra par e-mail.',
        'throttled' => 'Vous avez déjà envoyé plusieurs messages. Réessayez dans :minutes minutes ou appelez l’agence.',
        'phone' => 'Saisissez un numéro de téléphone valide, par exemple 06 12 34 56 78 ou +33 6 12 34 56 78.',
    ],

    'catalog' => [
        'price_range' => 'Le prix maximum doit être supérieur ou égal au prix minimum.',
        'availability_window' => 'La période demandée ne peut pas dépasser :months mois.',
        'start_in_past' => 'La date de départ ne peut pas être dans le passé.',
        'end_before_start' => 'La date de retour doit être après la date de départ.',
        'window_end_before_start' => 'La date de fin doit être après la date de début.',
    ],

    'booking' => [
        'car_unknown' => 'Cette voiture n’est pas disponible à la location.',
        'location_unknown' => 'Choisissez une de nos agences.',
        'date_format' => 'Indiquez la date et l’heure au format AAAA-MM-JJ HH:MM.',
        'end_before_start' => 'La restitution doit avoir lieu après la prise en charge.',
        'time_slot' => 'Choisissez une heure entre :open et :close, par tranche de :minutes minutes.',
        'start_in_past' => 'La date de prise en charge est déjà passée.',
        'lead_time' => 'La prise en charge doit avoir lieu au moins :hours heures après la réservation.',
        'too_far' => 'Vous pouvez réserver au maximum :months mois à l’avance.',
        'max_days' => 'La location ne peut pas dépasser :days jours.',
        'extra_unknown' => 'Cette option n’est pas disponible.',
        'extra_twice' => 'Chaque option ne peut être choisie qu’une fois.',
        'extra_max_quantity' => 'Vous pouvez prendre au maximum :max « :extra ».',
        'one_way_fee' => 'Frais de retour dans une autre agence',
        'already_booked' => 'Cette voiture est déjà réservée sur une partie de ces horaires. Choisissez d’autres dates ou une autre voiture.',
        'unavailable' => 'Cette voiture vient d’être réservée sur une partie de ces horaires. Choisissez d’autres dates ou une autre voiture.',
        'created' => 'Réservation envoyée. L’agence va la confirmer.',
        'cancelled' => 'Réservation annulée.',
        'expired_reason' => 'Demande expirée',
        'email_unverified' => 'Confirmez votre adresse e-mail avant de réserver une voiture.',
        'eligibility' => [
            'account_inactive' => 'Votre compte est désactivé. Contactez l’agence pour le réactiver.',
            'email_unverified' => 'Confirmez votre adresse e-mail avant de réserver une voiture.',
            'profile_incomplete' => 'Complétez votre profil pour réserver : :fields.',
            'under_age' => 'Vous devez avoir au moins :age ans le jour de la prise en charge.',
            'license_too_recent' => 'Il faut au moins :years ans de permis le jour de la prise en charge. Le vôtre les aura le :date.',
        ],
        'cancel' => [
            'not_cancellable' => 'Cette réservation ne peut plus être annulée : elle est « :status ».',
            'too_late' => 'L’annulation gratuite n’est possible que jusqu’à :hours heures avant la prise en charge. Pour toute modification, appelez l’agence :agency.',
        ],
    ],

    'admin' => [
        'pong' => 'Espace administrateur opérationnel. Bonjour, :name.',

        'reservations' => [
            'not_allowed' => 'Impossible :action une réservation « :status ».',
            'verbs' => [
                'pending' => 'de remettre en attente',
                'confirmed' => 'de confirmer',
                'rejected' => 'de refuser',
                'active' => 'de marquer comme récupérée',
                'completed' => 'de marquer comme rendue',
                'cancelled' => 'd’annuler',
            ],
            'car_removed' => 'Cette voiture a été retirée de la flotte : la réservation ne peut pas être confirmée.',
            'car_not_rentable' => 'Cette voiture est « :status » : remettez-la en service avant de confirmer la réservation.',
            'overlap' => 'La voiture est déjà réservée sur une partie de ces horaires (réservation :reference). Refusez l’une des deux demandes.',
            'confirmed' => 'Réservation confirmée.',
            'rejected' => 'Réservation refusée.',
            'picked_up' => 'Réservation marquée comme récupérée.',
            'returned' => 'Réservation marquée comme rendue.',
            'cancelled' => 'Réservation annulée.',
            'notes_saved' => 'Notes enregistrées.',
            'reason_required' => 'Indiquez le motif : il sera affiché au client.',
            'planning_range' => 'Le planning couvre au maximum :days jours.',
            'csv' => [
                'reference' => 'Référence',
                'status' => 'Statut',
                'client' => 'Client',
                'email' => 'E-mail',
                'phone' => 'Téléphone',
                'car' => 'Voiture',
                'plate' => 'Immatriculation',
                'pickup_location' => 'Agence de départ',
                'return_location' => 'Agence de retour',
                'start_at' => 'Début',
                'end_at' => 'Fin',
                'days' => 'Jours',
                'extras_total' => 'Options (DH)',
                'one_way_fee' => 'Frais aller simple (DH)',
                'total' => 'Total TTC (DH)',
                'created_at' => 'Créée le',
            ],
        ],

        'cars' => [
            'created' => 'Voiture ajoutée à la flotte.',
            'updated' => 'Voiture enregistrée.',
            'deleted' => 'Voiture retirée de la flotte.',
            'restored' => 'Voiture remise dans la flotte.',
            'status_changed' => 'Statut de la voiture modifié.',
            'plate' => 'Saisissez une immatriculation marocaine valide, par exemple 12345-A-6.',
            'plate_taken' => 'Cette immatriculation est déjà utilisée par une autre voiture.',
            'delete_blocked' => '{1} Impossible de retirer cette voiture : elle a une réservation à venir ou en cours (:references). Annulez-la ou attendez qu’elle soit terminée.|[2,*] Impossible de retirer cette voiture : elle a :count réservations à venir ou en cours (:references). Annulez-les ou attendez qu’elles soient terminées.',
            'status_conflicts' => '{1} Une réservation à venir ou en cours concerne cette voiture. Vérifiez-la avant de changer le statut.|[2,*] :count réservations à venir ou en cours concernent cette voiture. Vérifiez-les avant de changer le statut.',
            'images_uploaded' => '{1} Photo ajoutée.|[2,*] :count photos ajoutées.',
            'images_reordered' => 'Ordre des photos enregistré.',
            'image_updated' => 'Photo enregistrée.',
            'image_deleted' => 'Photo supprimée.',
            'image_unreadable' => 'Cette image est illisible. Envoyez une photo JPG, PNG ou WebP.',
            'reorder_mismatch' => 'La liste doit contenir toutes les photos de la voiture, une seule fois.',
            'photo_credit' => 'Tomobilti',
        ],

        'clients' => [
            'activated' => 'Compte réactivé.',
            'deactivated' => 'Compte désactivé. Le client a été déconnecté.',
            'not_a_client' => 'Ce compte n’est pas un compte client.',
            'cannot_deactivate_self' => 'Vous ne pouvez pas désactiver votre propre compte.',
            'cannot_deactivate_admin' => 'Un compte administrateur ne peut pas être désactivé depuis cet écran.',
        ],

        'settings' => [
            // Toasts of the settings: the same words as the buttons ("Ajouter une agence").
            'created' => [
                'category' => 'Catégorie ajoutée.',
                'brand' => 'Marque ajoutée.',
                'location' => 'Agence ajoutée.',
                'extra' => 'Option ajoutée.',
            ],
            'updated' => [
                'category' => 'Catégorie enregistrée.',
                'brand' => 'Marque enregistrée.',
                'location' => 'Agence enregistrée.',
                'extra' => 'Option enregistrée.',
            ],
            'deleted' => [
                'category' => 'Catégorie supprimée.',
                'brand' => 'Marque supprimée.',
                'location' => 'Agence supprimée.',
                'extra' => 'Option supprimée.',
            ],
            'icon' => 'Saisissez un nom d’icône lucide en minuscules, par exemple car-front.',
            'category_in_use' => '{1} Cette catégorie est utilisée par une voiture. Changez sa catégorie avant de la supprimer.|[2,*] Cette catégorie est utilisée par :count voitures. Changez leur catégorie avant de la supprimer.',
            'brand_in_use' => '{1} Cette marque est utilisée par une voiture. Changez sa marque avant de la supprimer.|[2,*] Cette marque est utilisée par :count voitures. Changez leur marque avant de la supprimer.',
            'location_in_use' => 'Cette agence est utilisée par des voitures ou des réservations : désactivez-la plutôt.',
            'extra_in_use' => 'Cette option a déjà été réservée : désactivez-la plutôt.',
        ],
    ],

    'documents' => [
        'one_way_fee' => 'Frais d’abandon',
        'to_bring' => [
            ['label' => 'CIN ou passeport', 'detail' => 'en cours de validité'],
            ['label' => 'Permis de conduire', 'detail' => 'original, 2 ans minimum'],
            ['label' => 'Carte bancaire', 'detail' => 'au nom du conducteur, pour la caution'],
        ],
    ],

    'invoices' => [
        'marked_paid' => 'Facture marquée comme payée.',
        'sent' => 'Facture envoyée au client.',
        'already_paid' => 'Cette facture est déjà payée.',
    ],

    'notifications' => [
        'read' => 'Notification lue.',
        'all_read' => 'Toutes les notifications sont lues.',
    ],

    'validation' => [
        'phone' => 'Saisissez un numéro marocain valide, par exemple 06 12 34 56 78 ou +212 6 12 34 56 78.',
        'email_taken' => 'Un compte existe déjà avec cette adresse e-mail.',
        'terms' => 'Vous devez accepter les conditions générales de location.',
        'min_age' => 'Vous devez avoir au moins :age ans.',
        'cin' => 'Saisissez un numéro de CIN valide, par exemple BE123456.',
        'cin_taken' => 'Ce numéro de CIN est déjà utilisé par un autre compte.',
        'license_in_future' => 'La date d’obtention du permis ne peut pas être dans le futur.',
        'license_before_adult' => 'Le permis ne peut pas avoir été obtenu avant vos 18 ans.',
        'password_same' => 'Le nouveau mot de passe doit être différent de l’actuel.',
    ],

];

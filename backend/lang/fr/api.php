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

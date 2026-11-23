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

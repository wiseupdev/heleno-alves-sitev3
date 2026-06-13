/**
 * features-i18n.js — Heleno Alves
 * Dicionário centralizado de tradução de características, tags, tipos e status.
 * Versão 2.0 — dicionário expandido com todos os termos do projeto.
 */
const HA_FEATURES = (function () {

  const dict = {
    /* ─── Localização / vista ─────────────────────────────────── */
    frente_mar:           { pt: 'Frente mar',        en: 'Oceanfront',           es: 'Frente al mar',       fr: 'Front de mer' },
    vista_mar:            { pt: 'Vista mar',          en: 'Ocean view',            es: 'Vista al mar',        fr: 'Vue mer' },
    vista_definitiva:     { pt: 'Vista definitiva',   en: 'Permanent view',        es: 'Vista definitiva',    fr: 'Vue dégagée permanente' },
    vista_panoramica:     { pt: 'Vista panorâmica',   en: 'Panoramic view',        es: 'Vista panorámica',    fr: 'Vue panoramique' },
    vista_aberta:         { pt: 'Vista aberta',       en: 'Open view',             es: 'Vista abierta',       fr: 'Vue dégagée' },
    pe_na_areia:          { pt: 'Pé na areia',        en: 'Beachfront access',     es: 'A pie de playa',      fr: 'Accès direct à la plage' },
    alto_andar:           { pt: 'Alto andar',         en: 'High floor',            es: 'Piso alto',           fr: 'Étage élevé' },
    privacidade:          { pt: 'Privacidade',        en: 'Privacy',               es: 'Privacidad',          fr: 'Intimité' },
    brava_norte:          { pt: 'Brava Norte',        en: 'North Brava',           es: 'Brava Norte',         fr: 'Brava Nord' },
    brava_sul:            { pt: 'Brava Sul',          en: 'South Brava',           es: 'Brava Sur',           fr: 'Brava Sud' },
    barra_sul:            { pt: 'Barra Sul',          en: 'South Barra',           es: 'Barra Sul',           fr: 'Barra Sud' },
    barra_norte:          { pt: 'Barra Norte',        en: 'North Barra',           es: 'Barra Norte',         fr: 'Barra Nord' },
    centro:               { pt: 'Centro',             en: 'Downtown',              es: 'Centro',              fr: 'Centre' },
    marina:               { pt: 'Marina',             en: 'Marina',                es: 'Marina',              fr: 'Marina' },

    /* ─── Arquitetura / tipologia ─────────────────────────────── */
    arquitetura_assinada: { pt: 'Arquitetura assinada', en: 'Signature architecture', es: 'Arquitectura de autor', fr: 'Architecture signée' },
    arquitetura_autoral:  { pt: 'Arquitetura autoral',  en: 'Original architecture',  es: 'Arquitectura autoral',  fr: 'Architecture originale' },
    cobertura:            { pt: 'Cobertura',          en: 'Penthouse',             es: 'Penthouse',           fr: 'Penthouse' },
    triplex:              { pt: 'Triplex',            en: 'Triplex',               es: 'Triplex',             fr: 'Triplex' },
    duplex:               { pt: 'Duplex',             en: 'Duplex',                es: 'Dúplex',              fr: 'Duplex' },
    garden:               { pt: 'Garden',             en: 'Garden apartment',      es: 'Apartamento garden',  fr: 'Appartement garden' },
    apartamento:          { pt: 'Apartamento',        en: 'Apartment',             es: 'Apartamento',         fr: 'Appartement' },
    casa:                 { pt: 'Casa',               en: 'House',                 es: 'Casa',                fr: 'Maison' },
    boutique:             { pt: 'Boutique',           en: 'Boutique property',     es: 'Boutique',            fr: 'Bien boutique' },
    planta_inteligente:   { pt: 'Planta inteligente', en: 'Smart floor plan',      es: 'Distribución inteligente', fr: 'Plan optimisé' },
    living_amplo:         { pt: 'Living amplo',       en: 'Spacious living area',  es: 'Living amplio',       fr: 'Grand séjour' },
    varanda_integrada:    { pt: 'Varanda integrada',  en: 'Integrated balcony',    es: 'Balcón integrado',    fr: 'Balcon intégré' },

    /* ─── Estado / status ────────────────────────────────────── */
    pronto_para_morar:    { pt: 'Pronto para morar',  en: 'Move-in ready',         es: 'Listo para vivir',    fr: 'Prêt à habiter' },
    pronto:               { pt: 'Pronto',             en: 'Ready',                 es: 'Listo',               fr: 'Prêt' },
    lancamento:           { pt: 'Lançamento',         en: 'New development',       es: 'Nuevo desarrollo',    fr: 'Nouveau programme' },
    em_construcao:        { pt: 'Em construção',      en: 'Under construction',    es: 'En construcción',     fr: 'En construction' },
    em_obra:              { pt: 'Em obra',            en: 'Under construction',    es: 'En obra',             fr: 'En travaux' },
    exclusivo:            { pt: 'Exclusivo',          en: 'Exclusive',             es: 'Exclusivo',           fr: 'Exclusif' },
    poucas_unidades:      { pt: 'Poucas unidades',    en: 'Limited units',         es: 'Pocas unidades',      fr: "Nombre limité d'unités" },
    alto_padrao:          { pt: 'Alto padrão',        en: 'High-end',              es: 'Alta gama',           fr: 'Haut standing' },
    mobiliado:            { pt: 'Mobiliado',          en: 'Furnished',             es: 'Amueblado',           fr: 'Meublé' },
    decorado:             { pt: 'Decorado',           en: 'Fully decorated',       es: 'Decorado',            fr: 'Décoré' },

    /* ─── Lazer / amenities ──────────────────────────────────── */
    piscina:              { pt: 'Piscina',            en: 'Swimming pool',         es: 'Piscina',             fr: 'Piscine' },
    piscina_privativa:    { pt: 'Piscina privativa',  en: 'Private pool',          es: 'Piscina privada',     fr: 'Piscine privée' },
    piscina_aquecida:     { pt: 'Piscina aquecida',   en: 'Heated pool',           es: 'Piscina climatizada', fr: 'Piscine chauffée' },
    piscina_infantil:     { pt: 'Piscina infantil',   en: "Children's pool",      es: 'Piscina infantil',    fr: 'Piscine enfants' },
    academia:             { pt: 'Academia',           en: 'Fitness center',        es: 'Gimnasio',            fr: 'Salle de sport' },
    churrasqueira:        { pt: 'Churrasqueira',      en: 'Barbecue area',         es: 'Zona de barbacoa',    fr: 'Espace barbecue' },
    area_gourmet:         { pt: 'Área gourmet',       en: 'Gourmet area',          es: 'Área gourmet',        fr: 'Espace gourmet' },
    sacada:               { pt: 'Sacada',             en: 'Balcony',               es: 'Balcón',              fr: 'Balcon' },
    terraco:              { pt: 'Terraço',            en: 'Terrace',               es: 'Terraza',             fr: 'Terrasse' },
    lazer_premium:        { pt: 'Lazer premium',      en: 'Premium leisure amenities', es: 'Ocio premium',   fr: 'Espaces loisirs premium' },
    lazer_completo:       { pt: 'Lazer completo',     en: 'Full leisure amenities',    es: 'Área de ocio completa', fr: 'Espaces loisirs complets' },
    lazer_vertical:       { pt: 'Lazer vertical',     en: 'Vertical amenities',    es: 'Ocio vertical',       fr: 'Loisirs verticaux' },
    salao_festas:         { pt: 'Salão de festas',    en: 'Party room',            es: 'Salón de fiestas',    fr: 'Salle de réception' },
    espaco_kids:          { pt: 'Espaço kids',        en: "Kids' area",           es: 'Espacio infantil',    fr: 'Espace enfants' },
    playground:           { pt: 'Playground',         en: 'Playground',            es: 'Parque infantil',     fr: 'Aire de jeux' },
    brinquedoteca:        { pt: 'Brinquedoteca',      en: 'Playroom',              es: 'Ludoteca',            fr: 'Salle de jeux' },
    sauna:                { pt: 'Sauna',              en: 'Sauna',                 es: 'Sauna',               fr: 'Sauna' },
    hidromassagem:        { pt: 'Hidromassagem',      en: 'Hot tub',               es: 'Hidromasaje',         fr: 'Bain à remous' },
    spa:                  { pt: 'Spa',                en: 'Spa',                   es: 'Spa',                 fr: 'Spa' },
    sala_jogos:           { pt: 'Sala de jogos',      en: 'Game room',             es: 'Sala de juegos',      fr: 'Salle de jeux' },
    coworking:            { pt: 'Coworking',          en: 'Coworking space',       es: 'Coworking',           fr: 'Espace coworking' },
    cinema:               { pt: 'Cinema',             en: 'Movie room',            es: 'Sala de cine',        fr: 'Salle de cinéma' },
    quadra_poliesportiva: { pt: 'Quadra poliesportiva', en: 'Multi-sport court',   es: 'Cancha polideportiva', fr: 'Terrain multisports' },
    pet_place:            { pt: 'Pet place',          en: 'Pet area',              es: 'Espacio pet',         fr: 'Espace animaux' },
    bicicletario:         { pt: 'Bicicletário',       en: 'Bicycle storage',       es: 'Bicicletero',         fr: 'Local à vélos' },
    lavabo:               { pt: 'Lavabo',             en: 'Powder room',           es: 'Baño de cortesía',    fr: 'WC invités' },
    hall_de_entrada:      { pt: 'Hall de entrada',    en: 'Entrance hall',         es: 'Hall de entrada',     fr: "Hall d'entrée" },
    hall_decorado:        { pt: 'Hall decorado',      en: 'Decorated entrance hall', es: 'Hall decorado',     fr: 'Hall décoré' },

    /* ─── Infraestrutura / segurança ─────────────────────────── */
    elevador:             { pt: 'Elevador',           en: 'Elevator',              es: 'Ascensor',            fr: 'Ascenseur' },
    portaria_24h:         { pt: 'Portaria 24h',       en: '24h concierge',         es: 'Portería 24h',        fr: 'Conciergerie 24h' },
    seguranca_24h:        { pt: 'Segurança 24h',      en: '24h security',          es: 'Seguridad 24h',       fr: 'Sécurité 24h' },
    condominio_fechado:   { pt: 'Condomínio fechado', en: 'Gated community',       es: 'Condominio cerrado',  fr: 'Résidence fermée' },
    condominio:           { pt: 'Condomínio',         en: 'Condominium',           es: 'Condominio',          fr: 'Copropriété' },
  };

  function normalizeKey(value) {
    if (!value) return '';
    return String(value)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function translate(feature, lang) {
    lang = lang || 'pt';
    const key = normalizeKey(feature);
    const entry = dict[key];
    if (entry && entry[lang]) return entry[lang];
    return feature; // fallback: texto original
  }

  function translateList(features, lang) {
    if (!Array.isArray(features)) return [];
    return features.map(function(f) { return translate(f, lang); });
  }

  return { translate: translate, translateList: translateList, normalizeKey: normalizeKey, _dict: dict };
})();

if (typeof window !== 'undefined') window.HA_FEATURES = HA_FEATURES;
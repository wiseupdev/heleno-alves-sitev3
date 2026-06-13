/**
 * features-i18n.js — Heleno Alves
 * Camada centralizada de tradução de características, tags, tipos e status de imóveis.
 * Normaliza o texto vindo do backend em chaves previsíveis e traduz para PT/EN/ES/FR.
 *
 * Uso:
 *   HA_FEATURES.translate('Frente mar', 'en')  → 'Oceanfront'
 *   HA_FEATURES.translate('Piscina', 'fr')     → 'Piscine'
 */
const HA_FEATURES = (function () {

  const dict = {
    // ─── Comodidades / lazer ──────────────────────────────────────
    lavabo:               { pt: 'Lavabo', en: 'Powder room', es: 'Baño de cortesía', fr: 'WC invités' },
    piscina:              { pt: 'Piscina', en: 'Swimming pool', es: 'Piscina', fr: 'Piscine' },
    piscina_aquecida:     { pt: 'Piscina aquecida', en: 'Heated pool', es: 'Piscina climatizada', fr: 'Piscine chauffée' },
    piscina_infantil:     { pt: 'Piscina infantil', en: "Children's pool", es: 'Piscina infantil', fr: 'Piscine enfants' },
    academia:             { pt: 'Academia', en: 'Fitness center', es: 'Gimnasio', fr: 'Salle de sport' },
    churrasqueira:        { pt: 'Churrasqueira', en: 'Barbecue area', es: 'Zona de barbacoa', fr: 'Espace barbecue' },
    sacada:               { pt: 'Sacada', en: 'Balcony', es: 'Balcón', fr: 'Balcon' },
    terraco:              { pt: 'Terraço', en: 'Terrace', es: 'Terraza', fr: 'Terrasse' },
    area_gourmet:         { pt: 'Área gourmet', en: 'Gourmet area', es: 'Área gourmet', fr: 'Espace gourmet' },
    salao_festas:         { pt: 'Salão de festas', en: 'Party room', es: 'Salón de fiestas', fr: 'Salle de réception' },
    espaco_kids:          { pt: 'Espaço kids', en: "Kids' area", es: 'Espacio infantil', fr: 'Espace enfants' },
    playground:           { pt: 'Playground', en: 'Playground', es: 'Parque infantil', fr: 'Aire de jeux' },
    brinquedoteca:        { pt: 'Brinquedoteca', en: 'Playroom', es: 'Ludoteca', fr: 'Salle de jeux' },
    sauna:                { pt: 'Sauna', en: 'Sauna', es: 'Sauna', fr: 'Sauna' },
    hidromassagem:        { pt: 'Hidromassagem', en: 'Hot tub', es: 'Hidromasaje', fr: 'Bain à remous' },
    spa:                  { pt: 'Spa', en: 'Spa', es: 'Spa', fr: 'Spa' },
    sala_jogos:           { pt: 'Sala de jogos', en: 'Game room', es: 'Sala de juegos', fr: 'Salle de jeux' },
    coworking:            { pt: 'Coworking', en: 'Coworking space', es: 'Coworking', fr: 'Espace coworking' },
    cinema:               { pt: 'Cinema', en: 'Movie room', es: 'Sala de cine', fr: 'Salle de cinéma' },
    quadra_poliesportiva: { pt: 'Quadra poliesportiva', en: 'Multi-sport court', es: 'Cancha polideportiva', fr: 'Terrain multisports' },
    pet_place:            { pt: 'Pet place', en: 'Pet area', es: 'Espacio pet', fr: 'Espace animaux' },
    bicicletario:         { pt: 'Bicicletário', en: 'Bicycle storage', es: 'Bicicletero', fr: 'Local à vélos' },
    hall_de_entrada:      { pt: 'Hall de entrada', en: 'Entrance hall', es: 'Hall de entrada', fr: "Hall d'entrée" },
    hall_decorado:        { pt: 'Hall decorado', en: 'Decorated entrance hall', es: 'Hall decorado', fr: 'Hall décoré' },
    lazer_premium:        { pt: 'Lazer premium', en: 'Premium amenities', es: 'Ocio premium', fr: 'Loisirs premium' },
    lazer_vertical:       { pt: 'Lazer vertical', en: 'Vertical amenities', es: 'Ocio vertical', fr: 'Loisirs verticaux' },

    // ─── Infraestrutura ───────────────────────────────────────────
    elevador:             { pt: 'Elevador', en: 'Elevator', es: 'Ascensor', fr: 'Ascenseur' },
    portaria_24h:         { pt: 'Portaria 24h', en: '24h concierge', es: 'Portería 24h', fr: 'Conciergerie 24h' },
    seguranca_24h:        { pt: 'Segurança 24h', en: '24h security', es: 'Seguridad 24h', fr: 'Sécurité 24h' },
    condominio:           { pt: 'Condomínio', en: 'Condominium', es: 'Condominio', fr: 'Copropriété' },

    // ─── Estado / padrão ──────────────────────────────────────────
    mobiliado:            { pt: 'Mobiliado', en: 'Furnished', es: 'Amueblado', fr: 'Meublé' },
    decorado:             { pt: 'Decorado', en: 'Fully decorated', es: 'Decorado', fr: 'Décoré' },
    alto_padrao:          { pt: 'Alto padrão', en: 'High-end', es: 'Alta gama', fr: 'Haut standing' },
    pronto_para_morar:    { pt: 'Pronto para morar', en: 'Move-in ready', es: 'Listo para vivir', fr: 'Prêt à habiter' },
    pronto:               { pt: 'Pronto', en: 'Ready', es: 'Listo', fr: 'Prêt' },
    lancamento:           { pt: 'Lançamento', en: 'New development', es: 'Nuevo desarrollo', fr: 'Nouveau programme' },
    em_construcao:        { pt: 'Em construção', en: 'Under construction', es: 'En construcción', fr: 'En construction' },
    em_obra:              { pt: 'Em obra', en: 'Under construction', es: 'En construcción', fr: 'En construction' },
    exclusivo:            { pt: 'Exclusivo', en: 'Exclusive', es: 'Exclusivo', fr: 'Exclusif' },
    boutique:             { pt: 'Boutique', en: 'Boutique', es: 'Boutique', fr: 'Boutique' },

    // ─── Tipologia ────────────────────────────────────────────────
    cobertura:            { pt: 'Cobertura', en: 'Penthouse', es: 'Penthouse', fr: 'Penthouse' },
    garden:               { pt: 'Garden', en: 'Garden apartment', es: 'Apartamento garden', fr: 'Appartement garden' },
    triplex:              { pt: 'Triplex', en: 'Triplex', es: 'Triplex', fr: 'Triplex' },
    apartamento:          { pt: 'Apartamento', en: 'Apartment', es: 'Apartamento', fr: 'Appartement' },
    casa:                 { pt: 'Casa', en: 'House', es: 'Casa', fr: 'Maison' },

    // ─── Vista / localização ──────────────────────────────────────
    vista_mar:            { pt: 'Vista mar', en: 'Ocean view', es: 'Vista al mar', fr: 'Vue mer' },
    frente_mar:           { pt: 'Frente mar', en: 'Oceanfront', es: 'Frente al mar', fr: 'Front de mer' },
    pe_na_areia:          { pt: 'Pé na areia', en: 'Beachfront', es: 'A pie de playa', fr: 'Pieds dans le sable' },
    vista_panoramica:     { pt: 'Vista panorâmica', en: 'Panoramic view', es: 'Vista panorámica', fr: 'Vue panoramique' },
    vista_aberta:         { pt: 'Vista aberta', en: 'Open view', es: 'Vista abierta', fr: 'Vue dégagée' },
    alto_andar:           { pt: 'Alto andar', en: 'High floor', es: 'Piso alto', fr: 'Étage élevé' },
    privacidade:          { pt: 'Privacidade', en: 'Privacy', es: 'Privacidad', fr: 'Intimité' },
    brava_norte:          { pt: 'Brava Norte', en: 'Brava Norte', es: 'Brava Norte', fr: 'Brava Norte' },

    // ─── Arquitetura ──────────────────────────────────────────────
    arquitetura_assinada: { pt: 'Arquitetura assinada', en: 'Signature architecture', es: 'Arquitectura de autor', fr: 'Architecture signée' },
    arquitetura_autoral:  { pt: 'Arquitetura autoral', en: 'Original architecture', es: 'Arquitectura autoral', fr: 'Architecture originale' },
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
    // Fallback: texto original, sem quebrar layout
    return feature;
  }

  function translateList(features, lang) {
    if (!Array.isArray(features)) return [];
    return features.map(f => translate(f, lang));
  }

  return { translate, translateList, normalizeKey, _dict: dict };
})();

if (typeof window !== 'undefined') window.HA_FEATURES = HA_FEATURES;
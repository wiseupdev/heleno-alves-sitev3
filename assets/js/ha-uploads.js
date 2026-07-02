/**
 * ha-uploads.js — Heleno Alves
 * Fluxo de upload IDÊNTICO ao do projeto antigo funcional:
 *   1) POST em services.wiseuptech.com.br/media/presigned com
 *      { filename, database_name, content_type } → recebe { upload_url, final_url }
 *   2) PUT do arquivo no upload_url (MinIO) com Content-Type do arquivo
 *   3) POST em webhook/adminWISEUPTECHmedias com os DADOS do imóvel +
 *      media_url, media_index, total_medias, database_name, database_platform.
 *
 * Os nomes dos campos do payload preservam EXATAMENTE o esperado pelo
 * N8n (titulo, descricao, cidade, bairro, rua, cep, numero, valor,
 * negociacao, tipo, quartos, banheiros, vagas, metros, condominio,
 * valorNegociacao, valorLocacao, caracteristicas, comodidades,
 * media_url, media_index, total_medias, tenant_id, database_name,
 * database_platform, event_name).
 */
(function (root) {
  const PRESIGNED_URL = 'https://services.wiseuptech.com.br/media/presigned';
  const MEDIA_URL     = 'https://webhook.wiseuptech.com.br/webhook/adminWISEUPTECHmedias';
  const TENANT_ID     = '1911202511';
  const DATABASE_NAME = 'helenoalvesbc';
  const DATABASE_PLATFORM = 'plataform_one';

  async function getPresigned(file) {
    const res = await fetch(PRESIGNED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        database_name: DATABASE_NAME,
        content_type: file.type,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`presigned ${res.status} ${t}`);
    }
    return res.json(); // { upload_url, final_url }
  }

  async function putToMinio(uploadUrl, file) {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`PUT MinIO ${res.status} ${t}`);
    }
    return true;
  }

  function buildBackendPayload(propertyData, mediaUrl, index, total) {
    // Mantém EXATAMENTE os nomes esperados pelo workflow N8n antigo
    return {
      titulo: propertyData.titulo || '',
      descricao: propertyData.descricao || '',
      cidade: propertyData.cidade || '',
      bairro: propertyData.bairro || '',
      rua: propertyData.rua || '',
      cep: propertyData.cep || '',
      numero: propertyData.numero || '',
      valor: propertyData.valor || '',
      negociacao: propertyData.negociacao || '',
      tipo: propertyData.tipo || '',
      quartos: propertyData.quartos || '',
      banheiros: propertyData.banheiros || '',
      vagas: propertyData.vagas || '',
      metros: propertyData.metros || '',
      condominio: propertyData.condominio || '',
      valorNegociacao: propertyData.valorNegociacao || '',
      valorLocacao: propertyData.valorLocacao || '',
      phone: propertyData.phone || '',
      email: propertyData.email || '',
      message: propertyData.message || '',
      area: propertyData.area || propertyData.metros || '',
      quarto: propertyData.quarto || propertyData.quartos || '',
      banheiro: propertyData.banheiro || propertyData.banheiros || '',
      vaga: propertyData.vaga || propertyData.vagas || '',
      endereco: propertyData.endereco || '',
      finalidade: propertyData.finalidade || '',
      event_name: propertyData.event_name || 'create_property',
      caracteristicas: propertyData.caracteristicas || '',
      comodidades: propertyData.comodidades || '',
      nome: propertyData.nome || '',
      tenant_id: TENANT_ID,
      database_name: DATABASE_NAME,
      database_platform: DATABASE_PLATFORM,
      media_url: mediaUrl,
      media_index: index,
      total_medias: total,
    };
  }

  async function sendMediaToBackend(mediaUrl, propertyData, index, total) {
    const body = buildBackendPayload(propertyData, mediaUrl, index, total);
    console.log(`[UPLOAD] enviando mídia ${index + 1}/${total}`);
    const res = await fetch(MEDIA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`adminWISEUPTECHmedias ${res.status} ${t}`);
    }
    return res.json().catch(() => ({}));
  }

  /**
   * Upload completo de um imóvel: para cada File em `files`,
   * presigned → PUT MinIO → POST webhook (sequencial, igual ao antigo).
   * Se files for vazio, envia uma única chamada sem mídia.
   * @param {Object} propertyData — campos brutos (titulo, descricao, …)
   * @param {File[]} files
   * @param {(progress: {index:number,total:number}) => void} [onProgress]
   */
  async function uploadProperty(propertyData, files, onProgress) {
    const arr = Array.isArray(files) ? files.filter(Boolean) : [];

    if (!arr.length) {
      await sendMediaToBackend('', propertyData, 0, 0);
      if (onProgress) onProgress({ index: 0, total: 0 });
      return { uploaded: 0 };
    }

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const { upload_url, final_url } = await getPresigned(file);
      await putToMinio(upload_url, file);
      await sendMediaToBackend(final_url, propertyData, i, arr.length);
      if (onProgress) onProgress({ index: i + 1, total: arr.length });
    }

    return { uploaded: arr.length };
  }

  root.HA_UPLOADS = {
    PRESIGNED_URL, MEDIA_URL, DATABASE_NAME, DATABASE_PLATFORM, TENANT_ID,
    getPresigned, putToMinio, sendMediaToBackend, uploadProperty,
  };
})(window);
